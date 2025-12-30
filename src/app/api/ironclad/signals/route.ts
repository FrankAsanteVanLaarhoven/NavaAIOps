import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

/**
 * Ingest signals from Rust scraper
 * POST /api/ironclad/signals
 */
export const runtime = 'nodejs';

const SignalSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  content: z.string(),
  category: z.enum(['Competitor', 'Vulnerability', 'Regulation']),
  relevance_score: z.number().optional().default(0.5),
  timestamp: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signals = Array.isArray(body) ? body : [body];

    const results = [];

    for (const signalData of signals) {
      const parsed = SignalSchema.parse(signalData);

      const signal = await db.signalStream.create({
        data: {
          id: parsed.id,
          url: parsed.url,
          content: parsed.content,
          category: parsed.category,
          relevanceScore: parsed.relevance_score,
          timestamp: parsed.timestamp 
            ? new Date(parsed.timestamp * 1000) 
            : new Date(),
          processed: false,
        },
      });

      results.push(signal);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      signals: results,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid signal data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to ingest signals' },
      { status: 500 }
    );
  }
}

/**
 * Get unprocessed signals
 * GET /api/ironclad/signals?limit=10
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const processed = searchParams.get('processed') === 'true';

    const signals = await db.signalStream.findMany({
      where: {
        processed,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      count: signals.length,
      signals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}
