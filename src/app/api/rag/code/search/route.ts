import { NextRequest, NextResponse } from 'next/server';
import { searchCode } from '@/lib/rag-assistant';
import { z } from 'zod';

const schema = z.object({
  query: z.string(),
  repository: z.string().optional(),
  limit: z.number().min(1).max(20).optional().default(5),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const repository = searchParams.get('repository') || undefined;
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const results = await searchCode(query, repository, limit);

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to search code' },
      { status: 500 }
    );
  }
}
