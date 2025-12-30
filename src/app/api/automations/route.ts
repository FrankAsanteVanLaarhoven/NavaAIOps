import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const automationSchema = z.object({
  name: z.string(),
  threadId: z.string().optional(),
  channelId: z.string().optional(),
  trigger: z.any(), // JSON object
  actions: z.array(z.any()), // JSON array
  enabled: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId') || undefined;
    const threadId = searchParams.get('threadId') || undefined;

    const automations = await db.automation.findMany({
      where: {
        ...(channelId && { channelId }),
        ...(threadId && { threadId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(automations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch automations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = automationSchema.parse(body);

    const automation = await db.automation.create({
      data: {
        name: data.name,
        threadId: data.threadId || undefined,
        channelId: data.channelId || undefined,
        trigger: JSON.stringify(data.trigger),
        actions: JSON.stringify(data.actions),
        enabled: data.enabled,
      },
    });

    return NextResponse.json(automation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create automation' },
      { status: 500 }
    );
  }
}
