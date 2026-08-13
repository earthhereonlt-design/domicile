'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { formatDate } from '@/lib/utils';

interface CertificatePreviewProps {
  certificate: {
    id?: string;
    applicationId: string;
    certificateId: string;
    fullName: string;
    fatherName: string;
    motherName?: string | null;
    dob: string;
    houseNo: string;
    streetLocality?: string | null;
    village: string;
    thana: string;
    tehsil: string;
    district: string;
    state: string;
    pinCode: string;
    photoBase64: string;
    issueDate: string | Date;
    investigationDate: string | Date;
    centerName: string;
    signerName: string;
    signerTitle: string;
    signerLocation: string;
  };
}

export default function CertificatePreview({ certificate }: CertificatePreviewProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
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

    QRCode.toDataURL(qrData, { margin: 1, width: 100 })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate preview QR code:', err));
  }, [certificate]);

  return (
    <div className="w-full overflow-x-auto p-1 bg-stone-100 dark:bg-stone-800 border border-border-color rounded-xl flex justify-center">
      {/* Exact Certificate Canvas Container */}
      <div 
        className="w-[680px] bg-white text-black p-6 select-none font-sans text-left border border-black shadow-md shrink-0 my-4"
        style={{ fontFamily: 'Arial, "Arial Unicode MS", "Helvetica Neue", sans-serif' }}
      >
        {/* Top Header Note */}
        <div className="text-[10px] mb-2 font-medium text-stone-900">
          &nbsp;ई-डिस्ट्रिक्ट के अन्तर्गत जारी..
        </div>

        {/* State Seal Emblem */}
        <div className="flex flex-col items-center mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/sealofup.jpg" 
            className="w-[110px] h-[110px] object-contain" 
            alt="Seal of Uttar Pradesh" 
          />
          <h1 className="text-3xl font-normal text-center mt-2" style={{ fontStyle: 'normal' }}>
            उत्तर प्रदेश शासन
          </h1>
          <h2 className="text-base font-bold text-center mt-2">
            कार्यालय उप जिलाधिकारी द्वारा प्रदत्त सामान्य निवास प्रमाण पत्र
          </h2>
        </div>

        {/* Metadata Details Row */}
        <div className="grid grid-cols-6 text-xs mt-6 mb-4 leading-relaxed font-semibold">
          <div className="col-span-1">जिला</div>
          <div className="col-span-2 font-bold">{certificate.district}</div>
          <div className="col-span-1"></div>
          <div className="col-span-2 text-right">
            जारी दिनांक: <span className="font-normal font-mono text-[11px]">{formatDate(certificate.issueDate)}</span>
          </div>

          <div className="col-span-1">तहसील</div>
          <div className="col-span-5 font-bold">{certificate.tehsil}</div>

          <div className="col-span-1">आवेदन क्र०</div>
          <div className="col-span-5 font-normal font-mono text-[11px]">{certificate.applicationId}</div>

          <div className="col-span-1">प्रमाणपत्र क्र०</div>
          <div className="col-span-5 font-normal font-mono text-[11px]">{certificate.certificateId}</div>
        </div>

        {/* Core Details Table */}
        <div className="w-full mt-6 mb-6">
          <table className="w-full text-xs border-collapse border-0">
            <tbody>
              {/* Inquiry report row */}
              <tr>
                <td className="w-[10%] align-top"></td>
                <td className="w-[65%] align-top pb-3 pr-2 text-stone-900" colSpan={2}>
                  सम्बन्धित लेखपाल की जांच आख्या दिनांक <span className="font-mono text-[11px] font-semibold">{formatDate(certificate.investigationDate)}</span> के आधार पर एतद् द्वारा
                </td>
                <td className="w-[25%] align-top pt-1" rowSpan={6}>
                  <div className="w-[96px] h-[96px] border border-stone-300 overflow-hidden bg-stone-50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={certificate.photoBase64} 
                      alt="Candidate photo" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </td>
              </tr>
              
              {/* Name */}
              <tr>
                <td className="w-[10%] align-middle"></td>
                <td className="w-[32%] h-5 align-middle text-stone-700">प्रमाणित किया जाता है कि</td>
                <td className="w-[33%] h-5 align-middle font-bold text-stone-950 font-sans">
                  {certificate.fullName}
                </td>
              </tr>

              {/* Father */}
              <tr>
                <td className="w-[10%] align-middle"></td>
                <td className="w-[32%] h-5 align-middle text-stone-700">पुत्र/पुत्री</td>
                <td className="w-[33%] h-5 align-middle font-bold text-stone-950">
                  {certificate.fatherName}
                </td>
              </tr>

              {/* Mother */}
              <tr>
                <td className="w-[10%] align-middle"></td>
                <td className="w-[32%] h-5 align-middle text-stone-700">माता का नाम</td>
                <td className="w-[33%] h-5 align-middle font-bold text-stone-950">
                  {certificate.motherName || 'संतोष देवी'}
                </td>
              </tr>

              {/* House No -> Date of Birth (जन्म तिथि) */}
              <tr>
                <td className="w-[10%] align-middle"></td>
                <td className="w-[32%] h-5 align-middle text-stone-700">जन्म तिथि</td>
                <td className="w-[33%] h-5 align-middle font-bold text-stone-950">
                  {certificate.dob}
                </td>
              </tr>

              {/* Locality */}
              <tr>
                <td className="w-[10%] align-middle"></td>
                <td className="w-[32%] h-5 align-middle"></td>
                <td className="w-[33%] h-5 align-middle font-bold text-stone-950">
                  {certificate.streetLocality || `ग्राम ${certificate.village} पोस्ट ${certificate.thana}`}
                </td>
              </tr>

              {/* Gram */}
              <tr>
                <td className="w-[10%] align-top pt-2"></td>
                <td className="w-[32%] h-5 align-top pt-2 text-stone-700">ग्राम</td>
                <td className="w-[33%] h-5 align-top pt-2 font-bold text-stone-950">
                  {certificate.village}
                </td>
              </tr>

              {/* Thana */}
              <tr>
                <td className="w-[10%] align-top pt-2"></td>
                <td className="w-[32%] h-5 align-top pt-2 text-stone-700">थाना</td>
                <td className="w-[33%] h-5 align-top pt-2 font-bold text-stone-950">
                  {certificate.thana}
                </td>
              </tr>

              {/* Tehsil */}
              <tr>
                <td className="w-[10%] align-top pt-2"></td>
                <td className="w-[32%] h-5 align-top pt-2 text-stone-700">तहसील</td>
                <td className="w-[33%] h-5 align-top pt-2 font-bold text-stone-950">
                  {certificate.tehsil}
                </td>
              </tr>

              {/* District */}
              <tr>
                <td className="w-[10%] align-top pt-2"></td>
                <td className="w-[32%] h-5 align-top pt-2 text-stone-700">जिला</td>
                <td className="w-[33%] h-5 align-top pt-2 font-bold text-stone-950">
                  {certificate.district}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Declaration Paragraphs */}
        <div className="text-xs leading-relaxed space-y-3 mt-6 mb-6">
          <p>
            उत्तर प्रदेश का/की निवासी है व उसका वर्तमान पता मकान नम्बर <u><b>{certificate.houseNo}</b></u> ग्राम् <u><b>{certificate.village}</b></u> जन्म तिथि <u><b>{certificate.dob}</b></u> तहसील <u><b>{certificate.tehsil}</b></u> ,जनपद <u><b>{certificate.district}</b></u> उत्तर प्रदेश है |
          </p>
          <p>
            2.उपर्युक्त की पुष्टि प्रारूप - १ में आवेदन एवं सत्यापनकर्ता द्वारा उपलब्ध कराई गई सूचना तथा इससे संतुष्ट हो जाने के उपरान्त अधोहस्ताक्षरी द्वारा उत्तर प्रदेश के इस जनपद का सामान्य निवासी होने विषयक प्रमाण पत्र निर्गत किया जा रहा है।
          </p>
        </div>

        {/* Verification QR Code */}
        <div className="flex justify-center my-6">
          {qrCodeDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={qrCodeDataUrl} 
              alt="Verification QR Code" 
              className="w-[100px] h-[100px] object-contain border border-stone-200" 
            />
          ) : (
            <div className="w-[100px] h-[100px] bg-stone-100 animate-pulse border border-stone-200" />
          )}
        </div>

        {/* Signatory Columns */}
        <div className="w-full mt-6 mb-4">
          <table className="w-full text-[10px] leading-relaxed border-collapse border-0">
            <tbody>
              <tr>
                {/* Left: JSK Details (Left empty per user request) */}
                <td className="w-[30%] align-bottom text-stone-950">
                </td>

                {/* Middle: Digital Signature Text */}
                <td className="w-[38%] align-top text-center pt-2">
                  <div className="text-xl font-bold text-stone-950 font-sans leading-none mb-1">
                    {certificate.signerName}
                  </div>
                  <div className="text-[8px] text-stone-500 font-mono leading-tight">
                    Digitally Signed by {certificate.signerName}
                    <br />
                    O=Personal, S=Uttar Pradesh
                  </div>
                </td>

                {/* Right: SDM Competent Authority */}
                <td className="w-[32%] align-bottom text-center text-stone-950">
                  <b>सक्षम अधिकारी/उप जिलाधिकारी</b>
                  <br />
                  डिजिटल हस्ताक्षरित
                  <br />
                  {certificate.signerLocation}
                  <br />
                  <b>दिनॉंक:</b> <span className="font-mono text-[10px]">{formatDate(certificate.issueDate)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Footer Note */}
        <div className="border-t border-stone-300 pt-3 mt-4 text-[7px] leading-relaxed text-stone-700 text-center font-semibold">
          यह प्रमाण पत्र इलेक्ट्रॉनिक डिलिवरी सिस्टम द्वारा तैयार किया गया है तथा डिजिटल सिग्नेचर से हस्ताक्षरित है। सम्बन्धित केन्द्र के अधिकृत कर्मी द्वारा प्रमाणित किया गया है। यह प्रमाण पत्र वेबसाइट https://edistrict.up.gov.in पर इसका पहले आवेदन क्र० फिर प्रमाणपत्र क्र० अंकित कर,सत्यापित किया जा सकता है।
        </div>
      </div>
    </div>
  );
}
