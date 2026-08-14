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

    // Generate QR Code data content (raw text filled by user)
    const qrData = `आवेदन क्र०: ${certificate.applicationId}
प्रमाणपत्र क्र०: ${certificate.certificateId}
प्रमाणित किया जाता है कि: ${certificate.fullName}
पुत्र/पुत्री: ${certificate.fatherName}
माता का नाम: ${certificate.motherName || 'संतोष देवी'}
मकान नम्बर: ${certificate.houseNo}
ग्राम: ${certificate.village}
थाना: ${certificate.thana}
तहसील: ${certificate.tehsil}
जिला: ${certificate.district}
जारी दिनांक: ${formatDate(certificate.issueDate)}`;

    const qrBase64 = await QRCode.toDataURL(qrData, { margin: 1, width: 100 });

    // Perform exact value replacements in original HTML
    // 1. Emblem
    htmlContent = htmlContent.replace('./DOMICILE_files/sealofup.jpg', emblemBase64);

    // 2. Photo
    htmlContent = htmlContent.replace('./DOMICILE_files/showphotoCert.aspx', certificate.photoBase64);

    // 3. QR Code (replaces the original base64 GIF image with our user-data QR)
    const qrBase64Regex = /src="data:image\/gif;base64,[^"]+"/;
    htmlContent = htmlContent.replace(qrBase64Regex, `src="${qrBase64}"`);

    // 4. District
    // Replaces all occurrences of Kheri with the dynamic district
    htmlContent = htmlContent.replace('<b>खीरी </b>', `<b>${certificate.district} </b>`);
    htmlContent = htmlContent.replace('<b>खीरी </b>', `<b>${certificate.district} </b>`);
    htmlContent = htmlContent.replace('<u><b>खीरी </b></u>', `<u><b>${certificate.district} </b></u>`);

    // 5. Tehsil
    // Replaces all occurrences of Palia with the dynamic tehsil
    htmlContent = htmlContent.replace('<b>पलिया</b>', `<b>${certificate.tehsil}</b>`);
    htmlContent = htmlContent.replace('<b>पलिया</b>', `<b>${certificate.tehsil}</b>`);
    htmlContent = htmlContent.replace('<u><b>पलिया</b></u>', `<u><b>${certificate.tehsil}</b></u>`);

    // 6. Dates
    htmlContent = htmlContent.replace('14/07/2026', formatDate(certificate.issueDate));
    htmlContent = htmlContent.replace('14/07/2026', formatDate(certificate.issueDate));
    htmlContent = htmlContent.replace('14/07/2026', formatDate(certificate.issueDate));

    // 7. Application ID
    htmlContent = htmlContent.replace('261530020105045', certificate.applicationId);

    // 8. Certificate ID
    htmlContent = htmlContent.replace('236262010457', certificate.certificateId);

    // 9. Candidate Name
    htmlContent = htmlContent.replace('<b>  हिमांशु कुमार/Himanshu Kumar</b>', `<b>  ${certificate.fullName}</b>`);

    // 10. Father Name
    htmlContent = htmlContent.replace('<b>  अरुण कुमार</b>', `<b>  ${certificate.fatherName}</b>`);

    // 11. Mother Name
    htmlContent = htmlContent.replace('<b>संतोष देवी</b>', `<b>${certificate.motherName || 'संतोष देवी'}</b>`);

    // 12. House No -> Date of Birth (जन्म तिथि) in Details Table
    htmlContent = htmlContent.replace('valign="middle">मकान नम्बर', 'valign="middle">जन्म तिथि');
    htmlContent = htmlContent.replace('valign="middle" style="font-family: verdana;"><b>00</b>', `valign="middle" style="font-family: verdana;"><b>${certificate.dob}</b>`);
    
    // Maintain House No as 00 in declaration paragraph
    htmlContent = htmlContent.replace('<u><b>00</b></u>', '<u><b>00</b></u>');

    // 13. Address Locality
    htmlContent = htmlContent.replace('<b>ग्राम नगला पोस्ट पलिया कलां</b>', `<b>${certificate.streetLocality || `ग्राम ${certificate.village} पोस्ट ${certificate.thana}`}</b>`);
    htmlContent = htmlContent.replace('<u><b>ग्राम नगला पोस्ट पलिया कलां</b></u>', `<u><b>${certificate.dob}</b></u>`);

    // 14. Gram / Village
    htmlContent = htmlContent.replace('<b>नगला</b>&nbsp;', `<b>${certificate.village}</b>&nbsp;`);
    htmlContent = htmlContent.replace('<b><u>नगला </u></b>', `<b><u>${certificate.village} </u></b>`);

    // 15. Thana
    htmlContent = htmlContent.replace('<b>पलिया कलां</b>&nbsp;', `<b>${certificate.thana}</b>&nbsp;`);

    // 16. Signatures (Remove JSK block, replace SDM details)
    htmlContent = htmlContent.replace('<b>जारी कर्ता केन्द्र: जेठ कुमार यादव,वयम जन सेवा केंद्र</b>', '<b>&nbsp;</b>');
    htmlContent = htmlContent.replace('<b>पद: जेठ कुमार यादव, केन्द्र प्रभारी <br>स्थान :Ainth Pur,पलिया,पलियाकलॉ,पलिया,खीरी <br>दिनॉंक: <span style="font-size: 11px; font-family: verdana">13/08/2026</span><br>हस्ताक्षर एंव मुहर  </b>', '<b>&nbsp;</b>');

    // Replace Digital Signer Name (middle column):
    htmlContent = htmlContent.replace('Avneesh Kumar&nbsp;', `${certificate.signerName}&nbsp;`);
    htmlContent = htmlContent.replace('Digitally Signed by Avneesh Kumar', `Digitally Signed by ${certificate.signerName}`);

    // Replace competent authority SDM location (right column):
    htmlContent = htmlContent.replace('पलिया,खीरी', certificate.signerLocation);

    // 17. Inject the CSS stylesheet directly in the HTML
    const cssPath = path.join(process.cwd(), 'original_assets/JskStyle.css');
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      htmlContent = htmlContent.replace(
        '<link rel="stylesheet" type="text/css" href="./DOMICILE_files/JskStyle.css" media="print">',
        `<style type="text/css">${cssContent}</style>`
      );
    }

    // 18. Inject automatic browser print command without user interference
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
