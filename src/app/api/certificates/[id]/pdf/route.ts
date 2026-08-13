import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCertificatePDF } from '@/lib/pdf';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch certificate from DB
    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 });
    }

    // Get the request host for QR code URL generation
    const host = req.headers.get('host') || 'localhost:3000';

    // Generate the PDF Buffer
    const pdfBuffer = await generateCertificatePDF(certificate, host);

    // Clean file name
    const fileName = `certificate_${certificate.certificateId.replace(/\s+/g, '_')}.pdf`;

    // Stream PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF Generation API Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF document.' },
      { status: 500 }
    );
  }
}
