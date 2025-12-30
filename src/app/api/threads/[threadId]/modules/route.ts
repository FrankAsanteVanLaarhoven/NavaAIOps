import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const moduleSchema = z.object({
  type: z.enum(['github', 'linear', 'notion', 'incident', 'custom']),
  title: z.string(),
  data: z.any(), // JSON object
});

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const modules = await db.threadModule.findMany({
      where: { threadId: params.threadId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(modules);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const body = await req.json();
    const { type, title, data, channelId } = moduleSchema
      .extend({ channelId: z.string().optional() })
      .parse(body);

    const module = await db.threadModule.create({
      data: {
        threadId: params.threadId,
        channelId: channelId || undefined,
        type,
        title,
        data: JSON.stringify(data),
      },
    });

    return NextResponse.json(module);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create module' },
      { status: 500 }
    );
  }
}
