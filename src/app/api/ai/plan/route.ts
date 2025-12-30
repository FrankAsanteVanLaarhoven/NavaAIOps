import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

/**
 * Vercel Edge Function for CMDP Planning
 * Uses O3-Mini for fast, structured planning
 */
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { context, modelId = 'o1-mini' } = await req.json();

    const model = openai(modelId);

    const result = streamText({
      model,
      system: `You are an Autonomous SRE Controller using CMDP. You MUST output a structured Plan (JSON) that adheres to Governance & Regulations.

Context:
${JSON.stringify(context, null, 2)}

Output a JSON plan with the following structure:
{
  "id": "uuid",
  "goal": "string",
  "steps": [
    {
      "step": 1,
      "description": "string",
      "reflexor": "VISION|OPS|CODE|AUDIT|PREDICTION|ACTION",
      "action": "string or object",
      "params": {}
    }
  ]
}`,
      messages: [
        {
          role: 'user',
          content: 'Generate a CMDP plan for the given context.',
        },
      ],
      temperature: 0.1,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate plan' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
