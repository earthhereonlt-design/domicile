import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateApplicationId, generateCertificateId } from '@/lib/utils';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      fatherName,
      motherName,
      dob,
      houseNo,
      streetLocality,
      village,
      thana,
      tehsil,
      district,
      state,
      pinCode,
      photoBase64,
    } = body;

    // Default to the original certificate photo if not uploaded
    let photoData = photoBase64;
    if (!photoData) {
      try {
        const defaultPhotoPath = path.join(process.cwd(), 'public/showphotoCert.jpg');
        if (fs.existsSync(defaultPhotoPath)) {
          const buffer = fs.readFileSync(defaultPhotoPath);
          photoData = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        }
      } catch (err) {
        console.error('Failed to load default candidate photo on server fallback:', err);
      }
    }

    // Simple validation
    if (
      !fullName ||
      !fatherName ||
      !dob ||
      !village ||
      !thana ||
      !tehsil ||
      !district ||
      !pinCode ||
      !photoData
    ) {
      return NextResponse.json(
        { error: 'All required fields must be provided, including candidate photo.' },
        { status: 400 }
      );
    }

    const resolvedHouseNo = houseNo || '00';

    // Generate unique Application ID
    let applicationId = '';
    let isAppIdUnique = false;
    let attempts = 0;
    while (!isAppIdUnique && attempts < 10) {
      applicationId = generateApplicationId();
      const existing = await prisma.certificate.findUnique({
        where: { applicationId },
      });
      if (!existing) {
        isAppIdUnique = true;
      }
      attempts++;
    }

    // Generate unique Certificate ID
    let certificateId = '';
    let isCertIdUnique = false;
    attempts = 0;
    while (!isCertIdUnique && attempts < 10) {
      const certIds = generateCertificateId();
      certificateId = certIds.full;
      const existing = await prisma.certificate.findUnique({
        where: { certificateId },
      });
      if (!existing) {
        isCertIdUnique = true;
      }
      attempts++;
    }

    if (!isAppIdUnique || !isCertIdUnique) {
      return NextResponse.json(
        { error: 'System error: Could not generate unique identifiers. Please try again.' },
        { status: 500 }
      );
    }

    // Create verification URL to encode in the QR Code later
    // In our case, verification page will be: `/verify/[id]`
    // We'll return the generated certificate, and the frontend will use its ID to build the URL.

    // Save certificate to database
    const certificate = await prisma.certificate.create({
      data: {
        applicationId,
        certificateId,
        fullName,
        fatherName,
        motherName: motherName || null,
        dob,
        houseNo: resolvedHouseNo,
        streetLocality: streetLocality || null,
        village,
        thana,
        tehsil,
        district,
        state: state || 'उत्तर प्रदेश',
        pinCode,
        photoBase64: photoData,
        // The QR code URL will point to our verification route
      },
    });

    // Update with QR Code URL pointing to /verify/[id]
    // Note: We'll construct the verification URL on the server or client. Let's save the URL path.
    const verifyUrl = `/verify/${certificate.id}`;
    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificate.id },
      data: { qrCodeUrl: verifyUrl },
    });

    return NextResponse.json(updatedCertificate, { status: 201 });
  } catch (error: any) {
    console.error('Create certificate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save certificate record.' },
      { status: 500 }
    );
  }
}
