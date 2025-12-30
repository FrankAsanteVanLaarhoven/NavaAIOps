import { NextRequest, NextResponse } from 'next/server';
import { generateCertificate } from '@/lib/certs/certificate-generator';

/**
 * Certificate Generation API
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { executionLogs, planId, workspaceId } = body;

    if (!executionLogs || !planId || !workspaceId) {
      return NextResponse.json(
        { error: 'executionLogs, planId, and workspaceId are required' },
        { status: 400 }
      );
    }

    const { pdfBuffer, pdfHash } = await generateCertificate({
      executionLogs,
      planId,
      workspaceId,
    });

    // Return PDF as base64 or binary
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="navaflow-certificate-${pdfHash}.pdf"`,
        'X-Certificate-Hash': pdfHash,
      },
    });
  } catch (error: any) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
