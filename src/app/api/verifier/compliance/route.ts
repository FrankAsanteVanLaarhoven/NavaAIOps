import { NextRequest, NextResponse } from 'next/server';
import { checkCompliance } from '@/lib/ai/verifier';

/**
 * Compliance Check API
 * Pre-flight compliance verification
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { incidentId, proposedActions, workspaceId } = body;

    if (!incidentId || !proposedActions) {
      return NextResponse.json(
        { error: 'incidentId and proposedActions are required' },
        { status: 400 }
      );
    }

    const result = await checkCompliance({
      input: {
        incidentId,
        proposedActions,
      },
      workspaceId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Compliance check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check compliance' },
      { status: 500 }
    );
  }
}
