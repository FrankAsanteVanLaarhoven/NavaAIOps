import { NextRequest, NextResponse } from 'next/server';
import { streamAuditLogAnalysis } from '@/lib/ai-finetuned';

/**
 * Audit Log Analysis API using Fine-Tuned DevOps Model
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { logId, modelId, userId, useABTesting } = body;

    if (!logId) {
      return NextResponse.json(
        { error: 'logId is required' },
        { status: 400 }
      );
    }

    // Get audit log from database
    const { db } = await import('@/lib/db');
    const logEntry = await db.auditLog.findUnique({
      where: { id: logId },
    });

    if (!logEntry) {
      return NextResponse.json(
        { error: 'Audit log not found' },
        { status: 404 }
      );
    }

    // Stream the analysis
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamAuditLogAnalysis({
            logEntry: {
              tableName: logEntry.tableName,
              action: logEntry.action,
              userId: logEntry.userId,
              timestamp: logEntry.timestamp,
              metadata: logEntry.metadata ? JSON.parse(logEntry.metadata) : undefined,
            },
            userId: userId || logEntry.userId,
            modelId,
            useABTesting: useABTesting !== false,
          })) {
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
          controller.close();
        } catch (error: any) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Audit log analysis API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze audit log' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
