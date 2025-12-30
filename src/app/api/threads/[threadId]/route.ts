import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const thread = await db.thread.findUnique({
      where: { id: params.threadId },
      include: {
        channel: true,
        incidents: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json(thread);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const body = await req.json();
    const { isCanvas, canvasContent } = body;

    const thread = await db.thread.update({
      where: { id: params.threadId },
      data: {
        ...(isCanvas !== undefined && { isCanvas }),
        ...(canvasContent !== undefined && {
          canvasContent: canvasContent ? JSON.stringify(canvasContent) : null,
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(thread);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update thread' },
      { status: 500 }
    );
  }
}
