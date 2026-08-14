import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { formatDate } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';

    // Fetch certificate from DB
    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 });
    }

    // Read the original DOMICILE.html
    const htmlPath = path.join(process.cwd(), 'original_assets/DOMICILE.html');
    if (!fs.existsSync(htmlPath)) {
      return NextResponse.json({ error: 'Original template HTML not found.' }, { status: 500 });
    }
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Read the UP Seal emblem and convert to base64
    const emblemPath = path.join(process.cwd(), 'public/sealofup.jpg');
    let emblemBase64 = '';
    if (fs.existsSync(emblemPath)) {
      const buffer = fs.readFileSync(emblemPath);
      emblemBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }

    // --- Safe field accessors (never fall back to Hindi defaults) ---
    const safe = (v: string | null | undefined) => v || '';
    const fullName = safe(certificate.fullName);
    const fatherName = safe(certificate.fatherName);
    const motherName = safe(certificate.motherName);
    const dob = safe(certificate.dob);
    const village = safe(certificate.village);
    const thana = safe(certificate.thana);
    const tehsil = safe(certificate.tehsil);
    const district = safe(certificate.district);
    const locality = safe(certificate.streetLocality);
    const issueDateStr = formatDate(certificate.issueDate);

    // --- Build QR data — only include lines where value is non-empty ---
    const qrLines: string[] = [];
    if (certificate.applicationId) qrLines.push(`आवेदन क्र०: ${certificate.applicationId}`);
    if (certificate.certificateId) qrLines.push(`प्रमाणपत्र क्र०: ${certificate.certificateId}`);
    if (fullName) qrLines.push(`नाम: ${fullName}`);
    if (fatherName) qrLines.push(`पुत्र/पुत्री: ${fatherName}`);
    if (motherName) qrLines.push(`माता: ${motherName}`);
    if (dob) qrLines.push(`जन्म तिथि: ${dob}`);
    if (village) qrLines.push(`ग्राम: ${village}`);
    if (thana) qrLines.push(`थाना: ${thana}`);
    if (tehsil) qrLines.push(`तहसील: ${tehsil}`);
    if (district) qrLines.push(`जिला: ${district}`);
    if (issueDateStr) qrLines.push(`जारी दिनांक: ${issueDateStr}`);

    const qrBase64 = await QRCode.toDataURL(
      qrLines.length > 0 ? qrLines.join('\n') : certificate.certificateId,
      { margin: 1, width: 100 }
    );

    // ---- Replacements ----

    // 1. Emblem
    htmlContent = htmlContent.replace('./DOMICILE_files/sealofup.jpg', emblemBase64);

    // 2. Photo
    htmlContent = htmlContent.replace('./DOMICILE_files/showphotoCert.aspx', certificate.photoBase64);

    // 3. QR Code
    const qrBase64Regex = /src="data:image\/gif;base64,[^"]+"/;
    htmlContent = htmlContent.replace(qrBase64Regex, `src="${qrBase64}"`);

    // 4. District (blank-safe — if blank, replaced with empty string)
    htmlContent = htmlContent.replace('<b>खीरी </b>', `<b>${district} </b>`);
    htmlContent = htmlContent.replace('<b>खीरी </b>', `<b>${district} </b>`);
    htmlContent = htmlContent.replace('<u><b>खीरी </b></u>', `<u><b>${district} </b></u>`);

    // 5. Tehsil (blank-safe)
    htmlContent = htmlContent.replace('<b>पलिया</b>', `<b>${tehsil}</b>`);
    htmlContent = htmlContent.replace('<b>पलिया</b>', `<b>${tehsil}</b>`);
    htmlContent = htmlContent.replace('<u><b>पलिया</b></u>', `<u><b>${tehsil}</b></u>`);

    // 6. Issue dates
    htmlContent = htmlContent.replace('14/07/2026', issueDateStr);
    htmlContent = htmlContent.replace('14/07/2026', issueDateStr);
    htmlContent = htmlContent.replace('14/07/2026', issueDateStr);

    // 7. Application ID
    htmlContent = htmlContent.replace('261530020105045', certificate.applicationId);

    // 8. Certificate ID
    htmlContent = htmlContent.replace('236262010457', certificate.certificateId);

    // 9. Candidate Name (blank if not provided)
    htmlContent = htmlContent.replace('<b>  हिमांशु कुमार/Himanshu Kumar</b>', `<b>  ${fullName}</b>`);

    // 10. Father Name (blank if not provided)
    htmlContent = htmlContent.replace('<b>  अरुण कुमार</b>', `<b>  ${fatherName}</b>`);

    // 11. Mother Name — blank if not provided (NO fallback to 'संतोष देवी')
    htmlContent = htmlContent.replace('<b>संतोष देवी</b>', `<b>${motherName}</b>`);

    // 12. Replace 'मकान नम्बर' label with 'जन्म तिथि', and value with DOB (blank-safe)
    htmlContent = htmlContent.replace('valign="middle">मकान नम्बर', 'valign="middle">जन्म तिथि');
    htmlContent = htmlContent.replace(
      'valign="middle" style="font-family: verdana;"><b>00</b>',
      `valign="middle" style="font-family: verdana;"><b>${dob}</b>`
    );

    // Keep house no cell as-is in declaration paragraph
    htmlContent = htmlContent.replace('<u><b>00</b></u>', '<u><b>00</b></u>');

    // 13. Address Locality — blank if not provided (NO auto-build from village+thana)
    htmlContent = htmlContent.replace('<b>ग्राम नगला पोस्ट पलिया कलां</b>', `<b>${locality}</b>`);
    // Second occurrence of this pattern is for DOB in underlined cell
    htmlContent = htmlContent.replace('<u><b>ग्राम नगला पोस्ट पलिया कलां</b></u>', `<u><b>${dob}</b></u>`);

    // 14. Gram / Village (blank-safe)
    htmlContent = htmlContent.replace('<b>नगला</b>&nbsp;', `<b>${village}</b>&nbsp;`);
    htmlContent = htmlContent.replace('<b><u>नगला </u></b>', `<b><u>${village} </u></b>`);

    // 15. Thana (blank-safe)
    htmlContent = htmlContent.replace('<b>पलिया कलां</b>&nbsp;', `<b>${thana}</b>&nbsp;`);

    // 16. Signatures — remove JSK block, keep SDM
    htmlContent = htmlContent.replace(
      '<b>जारी कर्ता केन्द्र: जेठ कुमार यादव,वयम जन सेवा केंद्र</b>',
      '<b>&nbsp;</b>'
    );
    htmlContent = htmlContent.replace(
      '<b>पद: जेठ कुमार यादव, केन्द्र प्रभारी <br>स्थान :Ainth Pur,पलिया,पलियाकलॉ,पलिया,खीरी <br>दिनॉंक: <span style="font-size: 11px; font-family: verdana">13/08/2026</span><br>हस्ताक्षर एंव मुहर  </b>',
      '<b>&nbsp;</b>'
    );

    // 17. Digital Signer Name
    htmlContent = htmlContent.replace('Avneesh Kumar&nbsp;', `${certificate.signerName}&nbsp;`);
    htmlContent = htmlContent.replace('Digitally Signed by Avneesh Kumar', `Digitally Signed by ${certificate.signerName}`);

    // 18. SDM Location
    htmlContent = htmlContent.replace('पलिया,खीरी', certificate.signerLocation);

    // 19. Inject CSS stylesheet inline
    const cssPath = path.join(process.cwd(), 'original_assets/JskStyle.css');
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      htmlContent = htmlContent.replace(
        '<link rel="stylesheet" type="text/css" href="./DOMICILE_files/JskStyle.css" media="print">',
        `<style type="text/css">${cssContent}</style>`
      );
    }

    // 20. Auto-trigger browser print on open
    htmlContent = htmlContent.replace(
      '</body>',
      '<script type="text/javascript">window.onload = function() { window.print(); }</script></body>'
    );

    if (download) {
      const fileName = `certificate_${certificate.certificateId}.html`;
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } else {
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
  } catch (error: any) {
    console.error('HTML Generation API Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate HTML document.' },
      { status: 500 }
    );
  }
}
