import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { formatDate } from './utils';

/**
 * Generates a PDF certificate that mimics the exact traditional layout and wording
 * of the original UP e-District Domicile Certificate (DOMICILE.html).
 * 
 * @param certificate The certificate database record
 * @param host The request host header (e.g., localhost:3000 or domain.com)
 */
export async function generateCertificatePDF(certificate: any, host: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Create PDF Document (A4 size)
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 25, bottom: 25, left: 25, right: 25 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // 2. Load and Register Bilingual Hind Font
      const regularFontPath = path.join(process.cwd(), 'public/fonts/Hind-Regular.ttf');
      const boldFontPath = path.join(process.cwd(), 'public/fonts/Hind-Bold.ttf');

      if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
        reject(new Error('Bilingual font assets are missing. Please download Hind-Regular and Hind-Bold.'));
        return;
      }

      doc.registerFont('Hind', regularFontPath);
      doc.registerFont('Hind-Bold', boldFontPath);

      // 3. Draw Outer Border (Single 1px solid black border matching original HTML)
      doc.lineWidth(1);
      doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke('#000000');

      // 4. "ई-डिस्ट्रिक्ट के अन्तर्गत जारी.." top note
      doc.font('Hind').fontSize(9.5).fillColor('#000000');
      doc.text('ई-डिस्ट्रिक्ट के अन्तर्गत जारी..', 30, 32);

      // 5. Load State Emblem (UP Seal) in top center
      const emblemPath = path.join(process.cwd(), 'public/sealofup.jpg');
      const centerLogoX = (doc.page.width / 2) - 45; // 90 width
      if (fs.existsSync(emblemPath)) {
        doc.image(emblemPath, centerLogoX, 42, { width: 90, height: 90 });
      }

      // 6. Header Titles (Exactly matching DOMICILE.html sizing & layout)
      doc.font('Hind-Bold').fontSize(22).fillColor('#000000');
      doc.text('उत्तर प्रदेश शासन', 0, 138, { align: 'center', width: doc.page.width });

      doc.fontSize(13.5).fillColor('#000000');
      doc.text('कार्यालय उप जिलाधिकारी द्वारा प्रदत्त सामान्य निवास प्रमाण पत्र', 0, 168, {
        align: 'center',
        width: doc.page.width,
      });

      // 7. Metadata Grid (Bilingual values, right-aligned date)
      const metaY = 198;
      doc.font('Hind-Bold').fontSize(10.5);
      doc.text('जिला', 35, metaY);
      doc.font('Hind-Bold').text(certificate.district, 85, metaY);

      doc.font('Hind-Bold').text('तहसील', 35, metaY + 17);
      doc.font('Hind-Bold').text(certificate.tehsil, 85, metaY + 17);

      doc.font('Hind-Bold').text('आवेदन क्र०', 35, metaY + 34);
      doc.font('Hind-Bold').text(certificate.applicationId, 110, metaY + 34);

      doc.font('Hind-Bold').text('प्रमाणपत्र क्र०', 35, metaY + 51);
      doc.font('Hind-Bold').text(certificate.certificateId, 110, metaY + 51);

      // Right-aligned Issue Date
      const rightColX = doc.page.width - 200;
      doc.font('Hind-Bold').text('जारी दिनांक:', rightColX, metaY + 17);
      doc.font('Hind').text(formatDate(certificate.issueDate), rightColX + 60, metaY + 17);

      // 8. Core details table (borderless, with Lekhpal report text at row 1)
      const gridStartY = 282;
      const labelX = 60;
      const valueX = 220;
      const rowHeight = 19;

      // Inquiry Report text
      doc.font('Hind').fontSize(10).fillColor('#000000');
      const inquiryText = `सम्बन्धित लेखपाल की जांच आख्या दिनांक ${formatDate(certificate.investigationDate)} के आधार पर एतद् द्वारा`;
      doc.text(inquiryText, labelX, gridStartY, { width: 330 });

      // Decode and Render Candidate Photo on the right side
      const photoX = doc.page.width - 145; // 96 width
      const photoY = gridStartY;
      const photoWidth = 96;
      const photoHeight = 96;

      try {
        const cleanBase64 = certificate.photoBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const photoBuffer = Buffer.from(cleanBase64, 'base64');
        doc.image(photoBuffer, photoX, photoY, { width: photoWidth, height: photoHeight });
      } catch (err) {
        console.error('Failed to render candidate photo in PDF:', err);
        // Draw a fallback box
        doc.lineWidth(0.5).rect(photoX, photoY, photoWidth, photoHeight).stroke('#777777');
        doc.font('Hind').fontSize(7.5).fillColor('#777777');
        doc.text('Photo Placeholder', photoX, photoY + 40, { width: photoWidth, align: 'center' });
      }

      // Populate core details
      const tableRows = [
        { label: 'प्रमाणित किया जाता है कि', value: certificate.fullName },
        { label: 'पुत्र/पुत्री', value: certificate.fatherName },
        { label: 'माता का नाम', value: certificate.motherName || 'संतोष देवी' },
        { label: 'मकान नम्बर', value: certificate.houseNo },
        { label: '', value: certificate.streetLocality || `ग्राम ${certificate.village} Post ${certificate.thana}` },
        { label: 'ग्राम', value: certificate.village },
        { label: 'थाना', value: certificate.thana },
        { label: 'तहसील', value: certificate.tehsil },
        { label: 'जिला', value: certificate.district },
      ];

      tableRows.forEach((row, index) => {
        // Offset first row by 25 points to leave room for the Inquiry Report text
        const y = gridStartY + (index === 0 ? 1 : index) * rowHeight + 12;
        
        if (row.label) {
          doc.font('Hind').fillColor('#000000').text(row.label, labelX, y);
        }
        
        doc.font('Hind-Bold').fillColor('#000000').text(row.value, valueX, y);
      });

      // 9. Declaration Paragraphs with Underlined variables
      const paraStartY = gridStartY + (tableRows.length + 1) * rowHeight + 15;
      
      doc.font('Hind').fontSize(10.5).fillColor('#000000');
      
      // Paragraph 1: Replicating underlines for variables
      doc.text('उत्तर प्रदेश का/की निवासी है व उसका वर्तमान पता मकान नम्बर ', 35, paraStartY, { continued: true });
      doc.font('Hind-Bold').text(certificate.houseNo, { underline: true, continued: true });
      doc.font('Hind').text(' ग्राम् ', { continued: true });
      doc.font('Hind-Bold').text(certificate.village, { underline: true, continued: true });
      doc.font('Hind').text(' जन्म तिथि ', { continued: true });
      // Since original DOMICILE.html printed "ग्राम नगला पोस्ट पलिया कलां" for DOB, we print the formatted Date of Birth here
      doc.font('Hind-Bold').text(formatDate(certificate.dob), { underline: true, continued: true });
      doc.font('Hind').text(' तहसील ', { continued: true });
      doc.font('Hind-Bold').text(certificate.tehsil, { underline: true, continued: true });
      doc.font('Hind').text(' ,जनपद ', { continued: true });
      doc.font('Hind-Bold').text(certificate.district, { underline: true, continued: true });
      doc.font('Hind').text(' उत्तर प्रदेश है |');

      // Paragraph 2
      const p2 = `2.उपर्युक्त की पुष्टि प्रारूप - १ में आवेदन एवं सत्यापनकर्ता द्वारा उपलब्ध कराई गई सूचना तथा इससे संतुष्ट हो जाने के उपरान्त अधोहस्ताक्षरी द्वारा उत्तर प्रदेश के इस जनपद का सामान्य निवासी होने विषयक प्रमाण पत्र निर्गत किया जा रहा है।`;
      doc.text(p2, 35, paraStartY + 38, { width: doc.page.width - 70, align: 'justify', lineGap: 1.5 });

      // 10. Center-aligned QR Code
      const qrSize = 85;
      const qrX = (doc.page.width / 2) - (qrSize / 2);
      const qrY = paraStartY + 95;

      const protocol = host.startsWith('localhost') ? 'http' : 'https';
      const verifyUrl = `${protocol}://${host}/verify/${certificate.id}`;

      try {
        const qrBuffer = await QRCode.toBuffer(verifyUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: qrSize,
        });
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
      } catch (qrErr) {
        console.error('Failed to generate QR code for PDF:', qrErr);
      }

      // 11. Signatory Columns (Matching DOMICILE.html structure)
      const sigY = qrY + qrSize + 20;

      // Left Column: Jan Seva Kendra details
      doc.font('Hind-Bold').fontSize(8.5).fillColor('#000000');
      doc.text(`जारी कर्ता केन्द्र: ${certificate.centerName}`, 35, sigY, { width: 175, lineGap: 1 });
      doc.text(`पद: केन्द्र प्रभारी`, 35, sigY + 11);
      doc.text(`स्थान :Ainth Pur,पलिया,पलियाकलॉ,पलिया,खीरी`, 35, sigY + 22, { width: 175, lineGap: 1 });
      doc.text(`दिनॉंक: ${formatDate(certificate.issueDate)}`, 35, sigY + 45);
      doc.text(`हस्ताक्षर एंव मुहर`, 35, sigY + 56);

      // Middle Column: Digital signature text
      const midColX = 220;
      doc.font('Hind-Bold').fontSize(16).fillColor('#000000');
      doc.text(certificate.signerName, midColX, sigY + 8);
      doc.font('Hind').fontSize(7.5).fillColor('#333333');
      doc.text(`Digitally Signed by ${certificate.signerName}`, midColX, sigY + 28, { width: 150 });
      doc.text(`O=Personal, S=Uttar Pradesh`, midColX, sigY + 36, { width: 150 });

      // Right Column: Competent Authority SDM details
      const rightColSDMX = doc.page.width - 180;
      doc.font('Hind-Bold').fontSize(8.5).fillColor('#000000');
      doc.text('सक्षम अधिकारी/उप जिलाधिकारी', rightColSDMX, sigY, { width: 150, align: 'center' });
      doc.text('डिजिटल हस्ताक्षरित', rightColSDMX, sigY + 11, { width: 150, align: 'center' });
      doc.text(`${certificate.signerLocation}`, rightColSDMX, sigY + 22, { width: 150, align: 'center' });
      doc.font('Hind').text(`दिनॉंक: ${formatDate(certificate.issueDate)}`, rightColSDMX, sigY + 34, { width: 150, align: 'center' });

      // 12. Bottom Footer Note (Exact copy matching DOMICILE.html)
      const footerY = doc.page.height - 65;
      doc.font('Hind-Bold').fontSize(7).fillColor('#000000');
      const footerNote = `यह प्रमाण पत्र इलेक्ट्रॉनिक डिलिवरी सिस्टम द्वारा तैयार किया गया है तथा डिजिटल सिग्नेचर से हस्ताक्षरित है। सम्बन्धित केन्द्र के अधिकृत कर्मी द्वारा प्रमाणित किया गया है। यह प्रमाण पत्र वेबसाइट https://edistrict.up.gov.in पर इसका  पहले आवेदन क्र० फिर प्रमाणपत्र क्र० अंकित कर,सत्यापित किया जा सकता है।`;
      doc.text(footerNote, 35, footerY, { align: 'center', width: doc.page.width - 70, lineGap: 1 });

      // End document compilation
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
