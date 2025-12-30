import { NextRequest, NextResponse } from 'next/server';
import { executeMoEController } from '@/lib/ai/moe-controller';

/**
 * MoE Controller API
 * Multi-Grandmaster reasoning endpoint
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, query, context, useO3 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    const result = await executeMoEController({
      workspaceId,
      query,
      context,
      useO3: useO3 !== false, // Default to true
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('MoE Controller error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute MoE controller' },
      { status: 500 }
    );
  }
}
