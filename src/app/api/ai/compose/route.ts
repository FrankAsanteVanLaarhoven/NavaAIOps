import { NextRequest } from 'next/server';
import { improveCompose, tiptapToMarkdown } from '@/lib/ai';
import { z } from 'zod';

const schema = z.object({
  draft: z.any(), // TipTap JSON
  channelId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { draft, channelId } = schema.parse(body);
    
    // Convert TipTap JSON to markdown
    const markdown = tiptapToMarkdown(draft);
    
    const generator = improveCompose(markdown, channelId);
    
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
      JSON.stringify({ error: error.message || 'Failed to improve text' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
