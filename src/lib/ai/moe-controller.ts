import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { db } from '@/lib/db';

/**
 * Kaggle-MoE Controller-Router-Reflexor Architecture
 * Multi-Grandmaster reasoning system for autonomous SRE
 */

export type ReflexorType = 'VISION' | 'OPS' | 'CODE' | 'AUDIT' | 'PREDICTION';

export interface MoERequest {
  workspaceId?: string;
  query: string;
  context?: {
    incidentId?: string;
    threadId?: string;
    imageUrl?: string;
    metrics?: any[];
  };
  useO3?: boolean; // Use O3-mini for faster reasoning
}

export interface MoEResponse {
  controllerPlan: string;
  selectedReflexors: ReflexorType[];
  reflexorResults: Record<ReflexorType, any>;
  finalAnswer: string;
  confidence: number;
}

/**
 * Controller: Lightweight LLM (O1-mini) that handles planning and routing
 */
async function controllerPlan(request: MoERequest): Promise<{
  plan: string;
  reflexors: ReflexorType[];
  reasoning: string;
}> {
  const model = request.useO3
    ? openai('o1-mini') // Use O1-mini for faster planning
    : openai('gpt-4o-mini'); // Fallback

  const prompt = `You are the Controller in a Multi-Grandmaster (Kaggle-MoE) AI SRE system.

Query: ${request.query}

Context:
${request.context?.incidentId ? `- Incident ID: ${request.context.incidentId}` : ''}
${request.context?.imageUrl ? `- Image available: ${request.context.imageUrl}` : ''}
${request.context?.metrics ? `- Metrics available: ${request.context.metrics.length} data points` : ''}

Your task:
1. Analyze the query and determine which specialized "Reflexors" (experts) are needed
2. Create a step-by-step plan
3. Select the appropriate Reflexors from: VISION, OPS, CODE, AUDIT, PREDICTION

Available Reflexors:
- VISION: For analyzing infrastructure diagrams, dashboards, visual logs
- OPS: For operational tasks (scaling, rollbacks, deployments)
- CODE: For code analysis, security scanning, best practices
- AUDIT: For audit log analysis, compliance, security events
- PREDICTION: For deadline prediction, anomaly forecasting, proactive remediation

Respond in JSON format:
{
  "plan": "Step-by-step plan",
  "reflexors": ["VISION", "OPS"],
  "reasoning": "Why these reflexors were selected"
}`;

  try {
    const result = await generateText({
      model,
      prompt,
      temperature: 0.1, // Low temp for precise planning
      maxTokens: 500,
    });

    // Parse JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        plan: parsed.plan || 'No plan provided',
        reflexors: parsed.reflexors || [],
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    }

    // Fallback parsing
    return {
      plan: result.text,
      reflexors: ['OPS'], // Default to OPS
      reasoning: 'Default reflexor selection',
    };
  } catch (error: any) {
    console.error('Controller planning error:', error);
    return {
      plan: 'Error in planning',
      reflexors: ['OPS'],
      reasoning: error.message,
    };
  }
}

/**
 * Router: Dispatches to specialized Reflexors
 */
async function routeToReflexors(
  reflexors: ReflexorType[],
  request: MoERequest
): Promise<Record<ReflexorType, any>> {
  const results: Record<ReflexorType, any> = {} as any;

  for (const reflexor of reflexors) {
    try {
      switch (reflexor) {
        case 'VISION':
          results.VISION = await visionReflexor(request);
          break;
        case 'OPS':
          results.OPS = await opsReflexor(request);
          break;
        case 'CODE':
          results.CODE = await codeReflexor(request);
          break;
        case 'AUDIT':
          results.AUDIT = await auditReflexor(request);
          break;
        case 'PREDICTION':
          results.PREDICTION = await predictionReflexor(request);
          break;
      }
    } catch (error: any) {
      results[reflexor] = { error: error.message };
    }
  }

  return results;
}

/**
 * Vision Reflexor: Analyzes visual context (infrastructure diagrams, dashboards)
 */
async function visionReflexor(request: MoERequest): Promise<any> {
  // Import vision service dynamically
  const { encodeVisualContext } = await import('./vision-service');

  if (!request.context?.imageUrl) {
    return { error: 'No image URL provided' };
  }

  try {
    const visualEmbedding = await encodeVisualContext(request.context.imageUrl);
    return {
      visualContext: 'Image analyzed',
      embedding: visualEmbedding.slice(0, 10), // Return first 10 dims for preview
      hasAnomalies: false, // Would be determined by vision model
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Ops Reflexor: Handles operational tasks
 */
async function opsReflexor(request: MoERequest): Promise<any> {
  // Use existing SRE tools
  const { detectAnomalies, proposeRemediation } = await import('../agent/sre-tools');

  try {
    const anomalies = await detectAnomalies(request.workspaceId || '');
    const remediation = anomalies.length > 0
      ? await proposeRemediation(anomalies, request.workspaceId)
      : null;

    return {
      anomaliesDetected: anomalies.length,
      remediation: remediation ? {
        scriptName: remediation.scriptName,
        risk: remediation.risk,
      } : null,
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Code Reflexor: Analyzes code context
 */
async function codeReflexor(request: MoERequest): Promise<any> {
  // Use existing code analysis
  const { analyzeCodeContext } = await import('./ai-finetuned');

  try {
    if (request.context?.incidentId) {
      // Get code context from incident
      const incident = await db.incidentData.findUnique({
        where: { threadId: request.context.incidentId },
        include: {
          thread: {
            include: {
              modules: {
                where: { type: { in: ['github', 'linear'] } },
              },
            },
          },
        },
      });

      if (incident?.thread?.modules?.[0]) {
        const module = incident.thread.modules[0];
        const analysis = await analyzeCodeContext({
          moduleConfig: {
            type: module.type,
            config: JSON.parse(module.data || '{}'),
          },
          useABTesting: false,
        });

        return {
          codeAnalysis: analysis,
          moduleType: module.type,
        };
      }
    }

    return { message: 'No code context available' };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Audit Reflexor: Analyzes audit logs
 */
async function auditReflexor(request: MoERequest): Promise<any> {
  try {
    const recentLogs = await db.auditLog.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return {
      logCount: recentLogs.length,
      recentActions: recentLogs.map(log => ({
        action: log.action,
        table: log.tableName,
        timestamp: log.timestamp,
      })),
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Prediction Reflexor: Forecasts deadlines and proactive remediation
 */
async function predictionReflexor(request: MoERequest): Promise<any> {
  // Import real-time ops
  const { predictDeadlines } = await import('./realtime-ops');

  try {
    const predictions = await predictDeadlines({
      workspaceId: request.workspaceId || '',
      windowMinutes: 10,
    });

    return {
      predictedIncidents: predictions.predictedIncidents,
      proactiveActions: predictions.predictedIncidents.length > 0
        ? ['SCALE_UP', 'PRE_WARM_CACHE']
        : [],
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Main MoE Controller Entry Point
 */
export async function executeMoEController(request: MoERequest): Promise<MoEResponse> {
  // Step 1: Controller plans and selects reflexors
  const { plan, reflexors, reasoning } = await controllerPlan(request);

  // Step 2: Router dispatches to selected reflexors
  const reflexorResults = await routeToReflexors(reflexors, request);

  // Step 3: Synthesize final answer using O3-mini
  const model = request.useO3
    ? openai('o1-mini')
    : openai('gpt-4o-mini');

  const synthesisPrompt = `You are synthesizing results from multiple AI experts (Reflexors) in a Multi-Grandmaster system.

Original Query: ${request.query}

Controller Plan: ${plan}
Selected Reflexors: ${reflexors.join(', ')}
Reasoning: ${reasoning}

Reflexor Results:
${Object.entries(reflexorResults).map(([key, value]) => 
  `${key}: ${JSON.stringify(value, null, 2)}`
).join('\n\n')}

Synthesize a comprehensive answer that combines insights from all reflexors.
Provide a clear, actionable response with confidence score (0-1).`;

  const finalAnswer = await generateText({
    model,
    prompt: synthesisPrompt,
    temperature: 0.2,
    maxTokens: 1000,
  });

  // Calculate confidence based on reflexor results
  const confidence = calculateConfidence(reflexorResults, reflexors);

  return {
    controllerPlan: plan,
    selectedReflexors: reflexors,
    reflexorResults,
    finalAnswer: finalAnswer.text,
    confidence,
  };
}

/**
 * Calculate confidence score based on reflexor results
 */
function calculateConfidence(
  results: Record<ReflexorType, any>,
  reflexors: ReflexorType[]
): number {
  let totalConfidence = 0;
  let count = 0;

  for (const reflexor of reflexors) {
    const result = results[reflexor];
    if (result && !result.error) {
      totalConfidence += 0.8; // High confidence if no errors
      count++;
    } else if (result?.error) {
      totalConfidence += 0.3; // Low confidence if error
      count++;
    }
  }

  return count > 0 ? totalConfidence / count : 0.5;
}
