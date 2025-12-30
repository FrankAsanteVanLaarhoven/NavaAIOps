import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const incidentSchema = z.object({
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
  severity: z.enum(['sev-0', 'sev-1', 'sev-2', 'sev-3']).optional(),
  impact: z.string().optional(),
  rootCause: z.string().optional(),
  fix: z.string().optional(),
  timeline: z.array(z.any()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const incident = await db.incidentData.findUnique({
      where: { threadId: params.threadId },
      include: {
        thread: {
          include: {
            channel: true,
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json(incident);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch incident' },
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
    const data = incidentSchema.parse(body);

    // Check if thread exists and is in an incident channel
    const thread = await db.thread.findUnique({
      where: { id: params.threadId },
      include: { channel: true },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Create or update incident data
    const incident = await db.incidentData.upsert({
      where: { threadId: params.threadId },
      create: {
        threadId: params.threadId,
        status: data.status || 'investigating',
        severity: data.severity || 'sev-2',
        impact: data.impact,
        rootCause: data.rootCause,
        fix: data.fix,
        timeline: data.timeline ? JSON.stringify(data.timeline) : null,
      },
      update: {
        ...(data.status && { status: data.status }),
        ...(data.severity && { severity: data.severity }),
        ...(data.impact !== undefined && { impact: data.impact }),
        ...(data.rootCause !== undefined && { rootCause: data.rootCause }),
        ...(data.fix !== undefined && { fix: data.fix }),
        ...(data.timeline && { timeline: JSON.stringify(data.timeline) }),
        ...(data.status === 'resolved' && !thread.incidents?.resolvedAt && {
          resolvedAt: new Date(),
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(incident);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create/update incident' },
      { status: 500 }
    );
  }
}
