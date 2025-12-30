import { NextRequest, NextResponse } from 'next/server';
import { startIroncladLoop } from '../../../../server/lib/ironclad-loop/rdkd';

/**
 * Start Ironclad Adaptive Loop
 * POST /api/ironclad/start
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { enabled = true, intervalMs = 10 } = await req.json();

    await startIroncladLoop({
      rustScraperPath: process.env.RUST_SCRAPER_PATH,
      targetIntervalMs: intervalMs,
      embeddingModelPath: process.env.NANO_EMBED_MODEL_PATH,
      enabled,
    });

    return NextResponse.json({
      success: true,
      message: 'Ironclad loop started',
      intervalMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to start Ironclad loop' },
      { status: 500 }
    );
  }
}
