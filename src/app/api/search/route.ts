import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch, indexMessage } from '@/lib/search';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1),
  channelId: z.string().optional(),
  threadId: z.string().optional(),
  userId: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const channelId = searchParams.get('channelId') || undefined;
    const threadId = searchParams.get('threadId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const results = await hybridSearch(query, {
      channelId,
      threadId,
      userId,
      limit,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}

// Index a message (called after message creation)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId } = z.object({ messageId: z.string() }).parse(body);

    await indexMessage(messageId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Indexing failed' },
      { status: 500 }
    );
  }
}
