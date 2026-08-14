import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 });
    }

    return NextResponse.json(certificate);
  } catch (error: any) {
    console.error('Fetch certificate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve certificate record.' },
      { status: 500 }
    );
  }
}
