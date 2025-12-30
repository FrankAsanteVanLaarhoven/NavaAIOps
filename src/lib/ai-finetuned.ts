import { db } from './db';
import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { selectModelVariant, trackModelUsage } from './ab-testing';

/**
 * DevOps-Specialized Fine-Tuned AI Functions
 * Uses fine-tuned model: ft:gpt-4o-mini-navaflow-devops-v1
 * Trained on: 50 incidents, 500 audit logs, 300 code contexts
 */

// Get model provider based on model ID
function getModel(modelId: string) {
  if (modelId.startsWith('ft:') || modelId.startsWith('gpt-')) {
    return openai(modelId);
  }
  if (modelId.startsWith('claude-')) {
    return anthropic(modelId);
  }
  // Default to OpenAI
  return openai(modelId);
}

/**
 * Resolve Incident using Fine-Tuned DevOps Model
 * Model: ft:gpt-4o-mini-navaflow-devops-v1
 * Capabilities: Instant SEV classification, structured RCA, mitigation plans
 */
export async function resolveIncident({
  incidentId,
  userId,
  modelId,
  useABTesting = true,
}: {
  incidentId: string;
  userId?: string;
  modelId?: string;
  useABTesting?: boolean;
}) {
  const startTime = Date.now();

  // Select model variant (A/B testing or direct)
  const selectedModelId = modelId || (useABTesting && userId
    ? selectModelVariant(userId, 'incident')
    : process.env.FINETUNED_MODEL_ID || 'ft:gpt-4o-mini-navaflow-devops-v1');

  const incident = await db.incidentData.findUnique({
    where: { threadId: incidentId },
    include: {
      thread: {
        include: {
          channel: true,
          messages: {
            take: 10,
            orderBy: { createdAt: 'asc' },
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!incident) {
    throw new Error('Incident not found');
  }

  const context = `You are an expert Site Reliability Engineer (SRE) specialized in NavaFlow incident resolution.

Given this incident from NavaFlow:
Title: ${incident.thread?.title || 'Incident'}
Severity: ${incident.severity}
Status: ${incident.status}
Impact: ${incident.impact || 'Not specified'}
Root Cause: ${incident.rootCause || 'Under investigation'}
Channel: ${incident.thread?.channel?.name || 'Unknown'}

Recent messages:
${incident.thread?.messages
  .map(
    (m) =>
      `- ${m.user.name || m.user.email}: ${typeof m.content === 'string' ? m.content.substring(0, 200) : JSON.stringify(m.content).substring(0, 200)}`
  )
  .join('\n')}

Provide a structured resolution plan in JSON-compatible format:
1. Root Cause Analysis (RCA) - detailed technical analysis
2. Immediate Mitigation Steps - actions to take now
3. Short-term Fix - resolve within hours
4. Long-term Prevention Plan - prevent recurrence
5. Recommended Actions - specific next steps

Output in a concise, technical SRE tone. No filler text. Use NavaFlow terminology (SEV-0, SEV-1, Incident, AuditLog).`;

  try {
    const result = await generateText({
      model: getModel(selectedModelId),
      prompt: context,
      temperature: 0.1, // Low temp for precise SRE output
      maxTokens: 1000,
    });

    const responseTime = Date.now() - startTime;

    // Track usage for analytics
    if (userId) {
      await trackModelUsage(userId, selectedModelId, 'incident', {
        responseTime,
        tokensUsed: result.usage?.totalTokens,
      });
    }

    return result.text;
  } catch (error: any) {
    console.error('Incident resolution error:', error);
    throw new Error(`Failed to resolve incident: ${error.message}`);
  }
}

/**
 * Stream Incident Resolution
 */
export async function* streamIncidentResolution({
  incidentId,
  userId,
  modelId,
  useABTesting = true,
}: {
  incidentId: string;
  userId?: string;
  modelId?: string;
  useABTesting?: boolean;
}) {
  const startTime = Date.now();

  // Select model variant
  const selectedModelId = modelId || (useABTesting && userId
    ? selectModelVariant(userId, 'incident')
    : process.env.FINETUNED_MODEL_ID || 'ft:gpt-4o-mini-navaflow-devops-v1');

  const incident = await db.incidentData.findUnique({
    where: { threadId: incidentId },
    include: {
      thread: {
        include: {
          channel: true,
          messages: {
            take: 10,
            orderBy: { createdAt: 'asc' },
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!incident) {
    throw new Error('Incident not found');
  }

  const context = `You are an expert Site Reliability Engineer (SRE) specialized in NavaFlow incident resolution.

Given this incident:
Title: ${incident.thread?.title || 'Incident'}
Severity: ${incident.severity}
Status: ${incident.status}
Impact: ${incident.impact || 'Not specified'}
Root Cause: ${incident.rootCause || 'Under investigation'}

Provide a structured resolution plan:
1. Root Cause Analysis (RCA)
2. Immediate Mitigation Steps
3. Short-term Fix
4. Long-term Prevention Plan
5. Recommended Actions

Output in concise, technical SRE tone. Use NavaFlow terminology.`;

  try {
    const stream = streamText({
      model: getModel(selectedModelId),
      prompt: context,
      temperature: 0.1,
      maxTokens: 1000,
    });

    let tokenCount = 0;
    for await (const chunk of stream.textStream) {
      tokenCount++;
      yield chunk;
    }

    const responseTime = Date.now() - startTime;

    // Track usage
    if (userId) {
      await trackModelUsage(userId, selectedModelId, 'incident', {
        responseTime,
        tokensUsed: tokenCount,
      });
    }
  } catch (error: any) {
    console.error('Stream incident resolution error:', error);
    yield `Error: ${error.message}`;
  }
}

/**
 * Analyze Audit Log using Fine-Tuned Model
 * Capabilities: Drift detection, security event identification, RBAC suggestions
 */
export async function analyzeAuditLog({
  logEntry,
  userId,
  modelId,
  useABTesting = true,
}: {
  logEntry: {
    tableName: string;
    action: string;
    userId: string;
    timestamp: Date;
    metadata?: any;
  };
  userId?: string;
  modelId?: string;
  useABTesting?: boolean;
}) {
  const startTime = Date.now();

  // Select model variant
  const selectedModelId = modelId || (useABTesting && userId
    ? selectModelVariant(userId, 'audit')
    : process.env.FINETUNED_MODEL_ID || 'ft:gpt-4o-mini-navaflow-devops-v1');

  const context = `You are a DevOps Audit Specialist for NavaFlow.

Analyze this AuditLog entry:
Action: ${logEntry.action}
Table: ${logEntry.tableName}
User: ${logEntry.userId}
Timestamp: ${logEntry.timestamp.toISOString()}
Metadata: ${JSON.stringify(logEntry.metadata || {})}

Determine:
1. Root Cause - what caused this change
2. Security Impact - Critical/Medium/Low with reasoning
3. Drift Detection - unauthorized or unexpected changes
4. Recommended Action - specific RBAC/ABAC policy review or action

Output in concise, technical audit tone. Reference NavaFlow-specific tables (Message, Channel, Incident, AuditLog).`;

  try {
    const result = await generateText({
      model: getModel(selectedModelId),
      prompt: context,
      temperature: 0.2,
      maxTokens: 500,
    });

    const responseTime = Date.now() - startTime;

    // Track usage
    if (userId) {
      await trackModelUsage(userId, selectedModelId, 'audit', {
        responseTime,
        tokensUsed: result.usage?.totalTokens,
      });
    }

    return result.text;
  } catch (error: any) {
    console.error('Audit log analysis error:', error);
    throw new Error(`Failed to analyze audit log: ${error.message}`);
  }
}

/**
 * Stream Audit Log Analysis
 */
export async function* streamAuditLogAnalysis({
  logEntry,
  userId,
  modelId,
  useABTesting = true,
}: {
  logEntry: {
    tableName: string;
    action: string;
    userId: string;
    timestamp: Date;
    metadata?: any;
  };
  userId?: string;
  modelId?: string;
  useABTesting?: boolean;
}) {
  const startTime = Date.now();

  // Select model variant
  const selectedModelId = modelId || (useABTesting && userId
    ? selectModelVariant(userId, 'audit')
    : process.env.FINETUNED_MODEL_ID || 'ft:gpt-4o-mini-navaflow-devops-v1');

  const context = `You are a DevOps Audit Specialist for NavaFlow.

Analyze this AuditLog entry:
Action: ${logEntry.action}
Table: ${logEntry.tableName}
User: ${logEntry.userId}
Metadata: ${JSON.stringify(logEntry.metadata || {})}

Determine:
1. Root Cause
2. Security Impact (Critical/Medium/Low)
3. Drift Detection
4. Recommended Action

Output in concise, technical audit tone.`;

  try {
    const stream = streamText({
      model: getModel(selectedModelId),
      prompt: context,
      temperature: 0.2,
      maxTokens: 500,
    });

    let tokenCount = 0;
    for await (const chunk of stream.textStream) {
      tokenCount++;
      yield chunk;
    }

    const responseTime = Date.now() - startTime;

    // Track usage
    if (userId) {
      await trackModelUsage(userId, selectedModelId, 'audit', {
        responseTime,
        tokensUsed: tokenCount,
      });
    }
  } catch (error: any) {
    console.error('Stream audit log analysis error:', error);
    yield `Error: ${error.message}`;
  }
}

/**
 * Analyze Code Context using Fine-Tuned Model
 * Capabilities: Security scanning, RBAC checks, best practices
 */
export async function analyzeCodeContext({
  moduleConfig,
  userId,
  modelId,
  useABTesting = true,
}: {
  moduleConfig: {
    type: string;
    config: any;
    content?: string;
  };
  userId?: string;
  modelId?: string;
  useABTesting?: boolean;
}) {
  const startTime = Date.now();

  // Select model variant
  const selectedModelId = modelId || (useABTesting && userId
    ? selectModelVariant(userId, 'code')
    : process.env.FINETUNED_MODEL_ID || 'ft:gpt-4o-mini-navaflow-devops-v1');

  const context = `You are a Code Reviewer for NavaFlow Context Modules (${moduleConfig.type}).

Module Type: ${moduleConfig.type}
Config: ${JSON.stringify(moduleConfig.config)}
${moduleConfig.content ? `Content: ${moduleConfig.content.substring(0, 1000)}` : ''}

Provide:
1. Security Review - check for hardcoded keys, secrets, credentials (e.g., "sk-or-v1...")
2. Permission Check - verify RBAC/ABAC policies are appropriate
3. Best Practices - NavaFlow-specific recommendations
4. Integration Health - verify GitHub/Linear/Notion integration is secure
5. High Risk Flags - identify risky WorkflowTrigger configurations

Output in concise, technical code review tone. Reference NavaFlow ContextModule schema.`;

  try {
    const result = await generateText({
      model: getModel(selectedModelId),
      prompt: context,
      temperature: 0.1,
      maxTokens: 500,
    });

    const responseTime = Date.now() - startTime;

    // Track usage
    if (userId) {
      await trackModelUsage(userId, selectedModelId, 'code', {
        responseTime,
        tokensUsed: result.usage?.totalTokens,
      });
    }

    return result.text;
  } catch (error: any) {
    console.error('Code context analysis error:', error);
    throw new Error(`Failed to analyze code context: ${error.message}`);
  }
}
