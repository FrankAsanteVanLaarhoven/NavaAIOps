import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  workspaceId: z.string().optional(),
  provider: z.enum(['jira', 'linear', 'notion', 'github', 'sentry']),
  config: z.any(),
  enabled: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || undefined;

    const integrations = await db.integration.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(integrations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, provider, config, enabled } = createSchema.parse(body);

    const integration = await db.integration.create({
      data: {
        workspaceId: workspaceId || undefined,
        provider,
        config: JSON.stringify(config),
        enabled,
      },
    });

    return NextResponse.json(integration);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create integration' },
      { status: 500 }
    );
  }
}
