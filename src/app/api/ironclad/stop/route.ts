import { NextRequest, NextResponse } from 'next/server';
import { stopIroncladLoop } from '../../../../server/lib/ironclad-loop/rdkd';

/**
 * Stop Ironclad Adaptive Loop
 * POST /api/ironclad/stop
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    stopIroncladLoop();

    return NextResponse.json({
      success: true,
      message: 'Ironclad loop stopped',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to stop Ironclad loop' },
      { status: 500 }
    );
  }
}
