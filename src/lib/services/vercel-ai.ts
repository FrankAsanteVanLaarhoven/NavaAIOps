import { generateText, generateObject, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

/**
 * Vercel AI SDK - Unified AI Gateway
 * Supports: OpenAI, Anthropic, and other providers
 * Provides: Streaming, structured outputs, unified interface
 */

// Configure providers
const openaiProvider = openai({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropicProvider = process.env.ANTHROPIC_API_KEY
  ? anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null;

/**
 * Get AI provider based on model name
 */
function getProvider(model: string) {
  if (model.startsWith('gpt-') || model.startsWith('o1-')) {
    return openaiProvider;
  }
  if (model.startsWith('claude-') && anthropicProvider) {
    return anthropicProvider;
  }
  // Default to OpenAI
  return openaiProvider;
}

/**
 * Get model function for provider
 */
function getModel(model: string) {
  const provider = getProvider(model);
  return provider(model);
}

/**
 * Generate text using Vercel AI SDK
 */
export async function generateAIText(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  const { model = 'gpt-4o-mini', temperature = 0.7, maxTokens = 1000 } = options;

  try {
    const result = await generateText({
      model: getModel(model),
      prompt,
      temperature,
      maxTokens,
    });

    return result.text;
  } catch (error: any) {
    console.error('AI generation error:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Stream text generation
 */
export async function* streamAIText(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  const { model = 'gpt-4o-mini', temperature = 0.7, maxTokens = 1000 } = options;

  try {
    const result = await streamText({
      model: getModel(model),
      prompt,
      temperature,
      maxTokens,
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  } catch (error: any) {
    console.error('AI streaming error:', error);
    yield `Error: ${error.message}`;
  }
}

/**
 * Generate structured object
 */
export async function generateAIObject<T>(
  prompt: string,
  schema: any,
  options: {
    model?: string;
    temperature?: number;
  } = {}
): Promise<T> {
  const { model = 'gpt-4o-mini', temperature = 0.7 } = options;

  try {
    const result = await generateObject({
      model: getModel(model),
      schema,
      prompt,
      temperature,
    });

    return result.object as T;
  } catch (error: any) {
    console.error('AI object generation error:', error);
    throw new Error(`AI object generation failed: ${error.message}`);
  }
}

/**
 * Smart Ops Agent - Agentic AI for DevOps
 */
export async function smartOpsAgent(context: {
  incidentId: string;
  severity: string;
  description: string;
  recentCommits?: Array<{ sha: string; message: string; files: string[] }>;
  recentFiles?: Array<{ path: string; changes: string }>;
}) {
  const prompt = `You are a Smart Ops Agent analyzing a ${context.severity} incident.

Incident Description: ${context.description}

${context.recentCommits ? `Recent Commits:\n${context.recentCommits.map(c => `- ${c.sha}: ${c.message} (${c.files.join(', ')})`).join('\n')}` : ''}

${context.recentFiles ? `Recent File Changes:\n${context.recentFiles.map(f => `- ${f.path}: ${f.changes}`).join('\n')}` : ''}

Analyze this incident and provide:
1. Proposed Root Cause (with confidence level)
2. Likely Affected Files/Components
3. Recommended Investigation Steps
4. Potential Fixes

Format as JSON with: { rootCause: string, confidence: number, affectedFiles: string[], investigationSteps: string[], potentialFixes: string[] }`;

  try {
    const result = await generateAIObject<{
      rootCause: string;
      confidence: number;
      affectedFiles: string[];
      investigationSteps: string[];
      potentialFixes: string[];
    }>(
      prompt,
      {
        type: 'object',
        properties: {
          rootCause: { type: 'string' },
          confidence: { type: 'number' },
          affectedFiles: { type: 'array', items: { type: 'string' } },
          investigationSteps: { type: 'array', items: { type: 'string' } },
          potentialFixes: { type: 'array', items: { type: 'string' } },
        },
        required: ['rootCause', 'confidence', 'affectedFiles', 'investigationSteps', 'potentialFixes'],
      },
      { model: 'gpt-4o' } // Use more capable model for analysis
    );

    return result;
  } catch (error: any) {
    console.error('Smart Ops Agent error:', error);
    return {
      rootCause: 'Unable to analyze - AI service error',
      confidence: 0,
      affectedFiles: [],
      investigationSteps: ['Check logs', 'Review recent changes'],
      potentialFixes: [],
    };
  }
}
