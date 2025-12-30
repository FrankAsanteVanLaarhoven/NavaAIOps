import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { smartOpsAgent } from '@/lib/services/vercel-ai';

const schema = z.object({
  incidentId: z.string(),
});

/**
 * Smart Ops Agent - Agentic AI for incident analysis
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { incidentId } = schema.parse(body);

    // Get incident data
    const incident = await db.incidentData.findUnique({
      where: { threadId: incidentId },
      include: {
        thread: {
          include: {
            channel: true,
            messages: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    // Get recent repo files if GitHub integration exists
    const recentFiles = await db.repoFile.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    // Call Smart Ops Agent
    const analysis = await smartOpsAgent({
      incidentId: incident.id,
      severity: incident.severity,
      description: `${incident.impact || ''} ${incident.rootCause || ''}`.trim(),
      recentFiles: recentFiles.map((f) => ({
        path: f.filePath,
        changes: f.content.slice(0, 200),
      })),
    });

    // Update incident with analysis
    await db.incidentData.update({
      where: { id: incident.id },
      data: {
        rootCause: analysis.rootCause,
        // Store analysis in metadata (could add a new field)
      },
    });

    return NextResponse.json({
      incidentId: incident.id,
      analysis,
      confidence: analysis.confidence,
    });
  } catch (error: any) {
    console.error('Smart Ops Agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
