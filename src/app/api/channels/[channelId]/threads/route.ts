import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const threads = await db.thread.findMany({
      where: { channelId: params.channelId },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json(threads);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const { title } = await req.json();
    
    const thread = await db.thread.create({
      data: {
        channelId: params.channelId,
        title: title || null,
      },
    });
    
    return NextResponse.json(thread);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create thread' },
      { status: 500 }
    );
  }
}
