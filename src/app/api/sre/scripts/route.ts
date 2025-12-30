import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Remediation Scripts API
 * CRUD operations for remediation scripts
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    const scripts = await db.remediationScript.findMany({
      where: {
        enabled: true,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(scripts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scripts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, command, workspaceId, description, risk, estimatedDuration } = body;

    if (!name || !type || !command) {
      return NextResponse.json(
        { error: 'name, type, and command are required' },
        { status: 400 }
      );
    }

    const script = await db.remediationScript.create({
      data: {
        name,
        type,
        command,
        workspaceId: workspaceId || null,
        description: description || null,
        risk: risk || 'MEDIUM',
        estimatedDuration: estimatedDuration || null,
        enabled: true,
      },
    });

    return NextResponse.json(script);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create script' },
      { status: 500 }
    );
  }
}
