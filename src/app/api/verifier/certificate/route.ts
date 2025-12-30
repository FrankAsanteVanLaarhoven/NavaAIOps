import { NextRequest, NextResponse } from 'next/server';
import { generateCertificate } from '@/lib/ai/certifier';

/**
 * Certificate Generation API
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { incidentId, workspaceId } = body;

    if (!incidentId || !workspaceId) {
      return NextResponse.json(
        { error: 'incidentId and workspaceId are required' },
        { status: 400 }
      );
    }

    const certificate = await generateCertificate({
      incidentId,
      workspaceId,
    });

    return NextResponse.json(certificate);
  } catch (error: any) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
