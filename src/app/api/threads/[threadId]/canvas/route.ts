import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const thread = await db.thread.findUnique({
      where: { id: params.threadId },
      select: { canvasContent: true, isCanvas: true },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json({
      content: thread.canvasContent ? JSON.parse(thread.canvasContent) : null,
      isCanvas: thread.isCanvas,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch canvas' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { content, isCanvas } = await req.json();

    const thread = await db.thread.update({
      where: { id: params.threadId },
      data: {
        canvasContent: content ? JSON.stringify(content) : null,
        isCanvas: isCanvas ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, thread });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save canvas' },
      { status: 500 }
    );
  }
}
