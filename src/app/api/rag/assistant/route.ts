import { NextRequest } from 'next/server';
import { ragAssistant } from '@/lib/rag-assistant';
import { z } from 'zod';

const schema = z.object({
  query: z.string(),
  repository: z.string().optional(),
  channelId: z.string().optional(),
  threadId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, repository, channelId, threadId } = schema.parse(body);

    const generator = ragAssistant(query, repository, { channelId, threadId });

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of generator) {
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }
            controller.close();
          } catch (error: any) {
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get RAG response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
