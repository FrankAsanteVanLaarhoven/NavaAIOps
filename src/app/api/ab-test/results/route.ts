import { NextRequest, NextResponse } from 'next/server';
import { getABTestResults } from '@/lib/ab-testing';

/**
 * A/B Test Results API
 * Returns analytics for fine-tuned model vs base model
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const feature = searchParams.get('feature') || 'incident';
    const days = parseInt(searchParams.get('days') || '7', 10);

    const results = await getABTestResults(feature, days);

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get A/B test results' },
      { status: 500 }
    );
  }
}
