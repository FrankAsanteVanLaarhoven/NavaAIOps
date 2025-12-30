import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Approve SRE Agent Action
 * Human operator approves/rejects an action at an approval gate
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { updateId, approved, userId, reason } = body;

    if (!updateId || approved === undefined) {
      return NextResponse.json(
        { error: 'updateId and approved are required' },
        { status: 400 }
      );
    }

    const update = await db.incidentUpdate.findUnique({
      where: { id: updateId },
    });

    if (!update) {
      return NextResponse.json(
        { error: 'Incident update not found' },
        { status: 404 }
      );
    }

    if (update.status !== 'PENDING_HUMAN_APPROVAL') {
      return NextResponse.json(
        { error: 'Update is not pending approval' },
        { status: 400 }
      );
    }

    // Update the incident update with approval decision
    await db.incidentUpdate.update({
      where: { id: updateId },
      data: {
        status: approved ? 'SUCCESS' : 'REJECTED',
        approvedBy: approved ? userId : null,
        approvedAt: approved ? new Date() : null,
        content: JSON.stringify({
          ...JSON.parse(update.content || '{}'),
          approval: {
            approved,
            userId,
            reason,
            timestamp: new Date().toISOString(),
          },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: approved ? 'Action approved' : 'Action rejected',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process approval' },
      { status: 500 }
    );
  }
}
