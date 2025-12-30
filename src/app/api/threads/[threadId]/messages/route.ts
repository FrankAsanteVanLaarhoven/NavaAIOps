import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const messages = await db.message.findMany({
      where: { threadId: params.threadId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { content, userId } = await req.json();
    
    // Get or create a default user for demo
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
        },
      });
    }
    
    const message = await db.message.create({
      data: {
        threadId: params.threadId,
        userId: userId || user.id,
        content: typeof content === 'string' ? content : JSON.stringify(content),
      },
      include: { user: true },
    });
    
    // Update thread updatedAt
    await db.thread.update({
      where: { id: params.threadId },
      data: { updatedAt: new Date() },
    });
    
    // Index message for search (async, don't wait)
    fetch(`${req.nextUrl.origin}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: message.id }),
    }).catch(console.error);

    // Generate embedding and store (async)
    const { generateEmbedding } = await import('@/lib/services/embedding');
    const { extractSearchText } = await import('@/lib/search');
    const searchText = extractSearchText(message.content);
    
    Promise.all([
      generateEmbedding(searchText).then(async (embedding) => {
        // Store in MessageEmbedding table
        await db.messageEmbedding.create({
          data: {
            messageId: message.id,
            embedding: JSON.stringify(embedding),
          },
        }).catch(console.error);
      }),
      // Also update message.embedding for backward compatibility
      generateEmbedding(searchText).then(async (embedding) => {
        await db.message.update({
          where: { id: message.id },
          data: { embedding: JSON.stringify(embedding) },
        }).catch(console.error);
      }),
    ]).catch(console.error);

    // Process automation triggers (async)
    const { triggerWorkflows } = await import('@/lib/services/workflow');
    const channel = await db.channel.findUnique({
      where: { id: thread.channelId },
      select: { type: true },
    });
    
    triggerWorkflows({
      messageId: message.id,
      threadId: params.threadId,
      channelId: thread.channelId,
      userId: userId || user.id,
      messageText: searchText,
      channelType: channel?.type,
    }).catch(console.error);

    // Log message creation to audit trail
    const { logChange } = await import('@/lib/services/audit');
    logChange({
      tableName: 'Message',
      action: 'CREATE',
      recordId: message.id,
      userId: userId || user.id,
      metadata: { threadId: params.threadId, channelId: thread.channelId },
    }).catch(console.error);
    
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    );
  }
}
