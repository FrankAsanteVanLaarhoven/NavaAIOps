import { NextRequest } from 'next/server';
import { runSREAgent } from '@/lib/agent/sre-agent';

/**
 * AI SRE Agent API
 * Streams the autonomous SRE agent execution with human approval gates
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Use nodejs for async generators

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, severityThreshold, userId } = body;

    // Create a readable stream from the async generator
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;

        try {
          for await (const event of runSREAgent({
            workspaceId,
            severityThreshold,
            userId,
          })) {
            if (isClosed) break;
            
            try {
              // Send event as JSON line
              const data = JSON.stringify(event) + '\n';
              controller.enqueue(encoder.encode(data));
            } catch (enqueueError: any) {
              console.error('Error enqueueing event:', enqueueError);
              // Continue processing even if one event fails
            }
          }
        } catch (error: any) {
          console.error('SRE Agent stream error:', error);
          if (!isClosed) {
            try {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    phase: 'ERROR',
                    status: 'FAILED',
                    content: `Error: ${error.message || 'Unknown error'}`,
                    timestamp: new Date().toISOString(),
                  }) + '\n'
                )
              );
            } catch (enqueueError) {
              console.error('Error enqueueing error event:', enqueueError);
            }
          }
        } finally {
          if (!isClosed) {
            try {
              controller.close();
              isClosed = true;
            } catch (closeError) {
              console.error('Error closing stream:', closeError);
            }
          }
        }
      },
      cancel() {
        // Handle stream cancellation
        console.log('SRE Agent stream cancelled');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to start SRE agent' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
