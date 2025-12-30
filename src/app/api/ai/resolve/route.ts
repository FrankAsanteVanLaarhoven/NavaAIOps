import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { db } from '@/lib/db';

/**
 * Vercel Edge Function for Incident Resolution
 * Uses fine-tuned GPT-4o-Mini SRE Model for verification and reasoning
 */
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { incidentId, modelId = process.env.FINETUNED_MODEL_ID || 'gpt-4o-mini' } = await req.json();

    // Fetch incident data
    const incident = await db.incidentData.findUnique({
      where: { threadId: incidentId },
      include: {
        thread: {
          include: {
            channel: true,
          },
        },
      },
    });

    if (!incident || !incident.thread) {
      return new Response(
        JSON.stringify({ error: 'Incident not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const incidentContent = typeof incident.data === 'string' 
      ? JSON.parse(incident.data) 
      : incident.data;

    const model = openai(modelId);

    const context = `
You are a Site Reliability Engineer (SRE) using a fine-tuned DevOps model.
Given this incident:
Title: ${incidentContent?.title || 'Unknown'}
Severity: ${incident.severity || 'Unknown'}
Status: ${incident.status || 'Unknown'}
Impact: ${incident.impact || 'Unknown'}

Channel: ${incident.thread.channel.name}

Provide a structured resolution.
Break down your plan into sequential steps.
For each step, identify what Reflexors (tools) you need to use (e.g., "fetch-logs", "analyze-screenshot").
Output as JSON with a "steps" array.
`;

    const result = streamText({
      model,
      system: context,
      messages: [
        {
          role: 'user',
          content: incidentContent?.description || incidentContent?.rootCause || 'Analyze this incident and provide a resolution plan.',
        },
      ],
      temperature: 0.2,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to resolve incident' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
