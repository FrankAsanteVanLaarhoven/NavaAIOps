import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Clear existing data
    await db.message.deleteMany();
    await db.thread.deleteMany();
    await db.channel.deleteMany();
    await db.user.deleteMany();

    // Create demo user
    const user = await db.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
      },
    });

    // Create channel "ASDF"
    const channel = await db.channel.create({
      data: {
        name: 'ASDF',
      },
    });

    // Create a thread
    const thread = await db.thread.create({
      data: {
        channelId: channel.id,
        title: 'Welcome Thread',
      },
    });

    // Create some demo messages
    const messages = [
      {
        threadId: thread.id,
        userId: user.id,
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Hey everyone! Welcome to the ASDF channel.' }],
            },
          ],
        }),
      },
      {
        threadId: thread.id,
        userId: user.id,
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'This is a demo message to test the AI features.' }],
            },
          ],
        }),
      },
      {
        threadId: thread.id,
        userId: user.id,
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Try clicking the ' },
                { type: 'text', marks: [{ type: 'bold' }], text: 'AI Preview' },
                { type: 'text', text: ' button to see thread summarization!' },
              ],
            },
          ],
        }),
      },
    ];

    for (const msg of messages) {
      await db.message.create({ data: msg });
    }

    return NextResponse.json({ 
      success: true,
      channel: channel.id,
      thread: thread.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}
