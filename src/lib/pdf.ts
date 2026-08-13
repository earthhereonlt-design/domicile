import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { formatDate } from './utils';

/**
 * Generates a professional, bilingual PDF certificate using pdfkit.
 * Streams the PDF to a Buffer.
 * 
 * @param certificate The certificate database record
 * @param host The request host header (e.g., localhost:3000 or domain.com)
 */
export async function generateCertificatePDF(certificate: any, host: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Create a PDF Document (A4 size)
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 35, bottom: 35, left: 35, right: 35 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // 2. Define Font Paths (using our downloaded Hind font supporting Devanagari)
      const regularFontPath = path.join(process.cwd(), 'public/fonts/Hind-Regular.ttf');
      const boldFontPath = path.join(process.cwd(), 'public/fonts/Hind-Bold.ttf');

      if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
        reject(new Error('Required Hind font files are missing in public/fonts/. Please run downloads first.'));
        return;
      }

      doc.registerFont('Hind', regularFontPath);
      doc.registerFont('Hind-Bold', boldFontPath);

      // 3. Draw Premium Outer Borders
      doc.lineWidth(1.5);
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke('#1a1a1a');

      doc.lineWidth(0.5);
      doc.rect(34, 34, doc.page.width - 68, doc.page.height - 68).stroke('#666666');

      // 4. Load State Emblem (UP Seal)
      const emblemPath = path.join(process.cwd(), 'public/sealofup.jpg');
      const centerLogoX = (doc.page.width / 2) - 30; // 60 width
      if (fs.existsSync(emblemPath)) {
        doc.image(emblemPath, centerLogoX, 45, { width: 60, height: 60 });
      }

      // 5. Header Titles
      doc.font('Hind-Bold').fontSize(16).fillColor('#111111');
      doc.text('उत्तर प्रदेश शासन', 0, 115, { align: 'center', width: doc.page.width });

      doc.fontSize(12).fillColor('#222222');
      doc.text('कार्यालय उप जिलाधिकारी द्वारा प्रदत्त सामान्य निवास प्रमाण पत्र', 0, 138, {
        align: 'center',
        width: doc.page.width,
      });

      // 6. Metadata Header Section (District, Tehsil, Date)
      doc.lineWidth(0.5);
      doc.moveTo(45, 170).lineTo(doc.page.width - 45, 170).stroke('#cccccc');

      doc.font('Hind-Bold').fontSize(9.5).fillColor('#333333');
      doc.text('जिला / District:', 45, 180);
      doc.font('Hind').text(certificate.district, 115, 180);

      doc.font('Hind-Bold').text('तहसील / Tehsil:', 200, 180);
      doc.font('Hind').text(certificate.tehsil, 275, 180);

      doc.font('Hind-Bold').text('जारी दिनांक / Date:', 370, 180);
      doc.font('Hind').text(formatDate(certificate.issueDate), 455, 180);

      doc.moveTo(45, 200).lineTo(doc.page.width - 45, 200).stroke('#cccccc');

      // Application and Certificate Identifiers
      doc.font('Hind-Bold').text('आवेदन क्र० / Application No:', 45, 210);
      doc.font('Hind-Bold').text(certificate.applicationId, 170, 210).fillColor('#111111');

      doc.font('Hind-Bold').fillColor('#333333').text('प्रमाणपत्र क्र० / Certificate No:', 280, 210);
      doc.font('Hind-Bold').text(certificate.certificateId, 410, 210).fillColor('#111111');

      doc.moveTo(45, 230).lineTo(doc.page.width - 45, 230).stroke('#cccccc');

      // 7. Core Information Grid & Candidate Photo
      const gridStartY = 245;
      const col1Width = 160;
      const col2Width = 220;
      const rowHeight = 22;
      const gridWidth = col1Width + col2Width;

      // Draw Candidate Photo on the right side
      const photoX = 440;
      const photoY = 245;
      const photoSize = 90;

      // Outer Photo Border
      doc.lineWidth(0.5);
      doc.rect(photoX - 3, photoY - 3, photoSize + 6, photoSize + 6).stroke('#aaaaaa');

      // Decode and Render Candidate Photo
      try {
        const cleanBase64 = certificate.photoBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const photoBuffer = Buffer.from(cleanBase64, 'base64');
        doc.image(photoBuffer, photoX, photoY, { width: photoSize, height: photoSize });
      } catch (err) {
        console.error('Failed to render candidate photo in PDF:', err);
        // Draw a fallback box
        doc.font('Hind').fontSize(8).fillColor('#888888');
        doc.text('Photo Placeholder', photoX, photoY + 40, { width: photoSize, align: 'center' });
      }

      // Draw Grid Borders
      const rows = 9;
      const gridHeight = rows * rowHeight;

      // Draw grid horizontal lines
      for (let i = 0; i <= rows; i++) {
        const y = gridStartY + i * rowHeight;
        doc.moveTo(45, y).lineTo(45 + gridWidth, y).stroke('#dddddd');
      }

      // Draw grid vertical lines
      doc.moveTo(45, gridStartY).lineTo(45, gridStartY + gridHeight).stroke('#dddddd');
      doc.moveTo(45 + col1Width, gridStartY).lineTo(45 + col1Width, gridStartY + gridHeight).stroke('#dddddd');
      doc.moveTo(45 + gridWidth, gridStartY).lineTo(45 + gridWidth, gridStartY + gridHeight).stroke('#dddddd');

      // Populate Grid Content
      const data = [
        { label: 'प्रमाणित किया जाता है कि / Certified that', value: certificate.fullName },
        { label: 'पुत्र/पुत्री / Son/Daughter of', value: certificate.fatherName },
        { label: "माता का नाम / Mother's Name", value: certificate.motherName || 'संतोष देवी' },
        { label: 'मकान नम्बर / House Number', value: certificate.houseNo },
        { label: 'मोहल्ला/ग्राम / Village/Locality', value: `${certificate.streetLocality || ''} ${certificate.village}`.trim() },
        { label: 'थाना / Police Station', value: certificate.thana },
        { label: 'तहसील / Tehsil', value: certificate.tehsil },
        { label: 'जनपद / District', value: certificate.district },
        { label: 'जन्म तिथि / Date of Birth', value: formatDate(certificate.dob) },
      ];

      doc.fontSize(8.5).fillColor('#333333');
      data.forEach((item, index) => {
        const y = gridStartY + index * rowHeight + 6;
        doc.font('Hind-Bold').text(item.label, 52, y, { width: col1Width - 10 });
        doc.font('Hind-Bold').fillColor('#111111').text(item.value, 45 + col1Width + 8, y, { width: col2Width - 16 }).fillColor('#333333');
      });

      // 8. Paragraph Declarations
      const paraStartY = gridStartY + gridHeight + 20;
      doc.font('Hind').fontSize(9.5).fillColor('#222222');
      
      const p1 = `1. प्रमाणित किया जाता है कि उपरोक्त विवरण के अनुसार श्री/श्रीमती/कुमारी ${certificate.fullName} उत्तर प्रदेश के सामान्य निवासी हैं। वर्तमान में इनका पता: मकान नम्बर ${certificate.houseNo}, ग्राम ${certificate.village}, तहसील ${certificate.tehsil}, जनपद ${certificate.district}, उत्तर प्रदेश है।`;
      doc.text(p1, 45, paraStartY, { width: doc.page.width - 90, align: 'justify', lineGap: 3 });

      const p2 = `2. उपर्युक्त की पुष्टि प्रारूप - १ में आवेदन एवं सत्यापनकर्ता (लेखपाल/सम्बन्धित अधिकारी) द्वारा प्रस्तुत की गई जांच आख्या दिनांक ${formatDate(certificate.investigationDate)} में उपलब्ध कराई गई सूचना तथा इससे संतुष्ट हो जाने के उपरान्त अधोहस्ताक्षरी द्वारा उत्तर प्रदेश के इस जनपद का सामान्य निवासी होने विषयक प्रमाण पत्र निर्गत किया जा रहा है।`;
      doc.text(p2, 45, paraStartY + 55, { width: doc.page.width - 90, align: 'justify', lineGap: 3 });

      // 9. Signatory Section & QR Verification Box
      const footerStartY = paraStartY + 140;

      // Construct Verification URL
      const protocol = host.startsWith('localhost') ? 'http' : 'https';
      const verifyUrl = `${protocol}://${host}/verify/${certificate.id}`;

      // Generate Verification QR Code
      try {
        const qrBuffer = await QRCode.toBuffer(verifyUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 80,
        });

        // Place QR Code
        doc.image(qrBuffer, 45, footerStartY, { width: 80, height: 80 });

        // Add QR helper text
        doc.font('Hind').fontSize(7.5).fillColor('#555555');
        doc.text('सत्यापन हेतु क्यूआर कोड स्कैन करें / Scan for verification', 135, footerStartY + 15, { width: 180 });
        doc.text(`URL: ${verifyUrl}`, 135, footerStartY + 35, { width: 180 });
      } catch (qrErr) {
        console.error('Failed to generate QR code for PDF:', qrErr);
      }

      // Authorized Signatory Details (Right Side)
      const sigX = 350;
      doc.font('Hind-Bold').fontSize(9.5).fillColor('#111111');
      doc.text('सक्षम अधिकारी / Authorized Signatory', sigX, footerStartY);
      
      doc.font('Hind').fontSize(8.5).fillColor('#555555');
      doc.text('डिजिटल हस्ताक्षरित / Digitally Signed', sigX, footerStartY + 15);
      
      doc.font('Hind-Bold').fontSize(10).fillColor('#111111');
      doc.text(certificate.signerName, sigX, footerStartY + 32);
      
      doc.font('Hind').fontSize(9).fillColor('#444444');
      doc.text(certificate.signerTitle, sigX, footerStartY + 45);
      doc.text(certificate.signerLocation, sigX, footerStartY + 57);
      doc.text(`दिनांक / Date: ${formatDate(certificate.issueDate)}`, sigX, footerStartY + 69);

      // 10. Footer Disclaimer
      doc.lineWidth(0.5);
      doc.moveTo(45, doc.page.height - 75).lineTo(doc.page.width - 45, doc.page.height - 75).stroke('#cccccc');

      doc.font('Hind').fontSize(7).fillColor('#777777');
      const disclaimerHindi = `यह प्रमाण पत्र इलेक्ट्रॉनिक डिलिवरी सिस्टम द्वारा तैयार किया गया है तथा डिजिटल सिग्नेचर से हस्ताक्षरित है। इसे ऊपर दिए गए क्यूआर कोड या सत्यापन लिंक पर जाकर सत्यापित किया जा सकता है।`;
      doc.text(disclaimerHindi, 45, doc.page.height - 68, { align: 'center', width: doc.page.width - 90 });

      const disclaimerEnglish = `This is a digitally signed computer-generated document, verified via secure database records. It does not require a physical signature or seal.`;
      doc.text(disclaimerEnglish, 45, doc.page.height - 56, { align: 'center', width: doc.page.width - 90 });

      // Finalize document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
