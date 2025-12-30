import { NextRequest, NextResponse } from 'next/server';
import { streamIncidentResolution } from '@/lib/ai-finetuned';

/**
 * Incident Resolution API using Fine-Tuned DevOps Model
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { incidentId, modelId, userId, useABTesting } = body;

    if (!incidentId) {
      return NextResponse.json(
        { error: 'incidentId is required' },
        { status: 400 }
      );
    }

    // Stream the resolution
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamIncidentResolution({
            incidentId,
            modelId,
            userId,
            useABTesting: useABTesting !== false, // Default to true
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
    console.error('Incident resolution API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resolve incident' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
