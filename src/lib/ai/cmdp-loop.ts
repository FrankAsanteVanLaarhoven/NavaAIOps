import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { validateProposedAction, GovernancePolicies, type ProposedAction } from './validation-engine';
import { verifyExecution } from './verification-agent';
import { executeActionJitter } from '../ai/realtime-ops';
import { checkCompliance } from './verifier';
import { checkResourceLimits } from './resource-guard';
import { db } from '../db';

/**
 * CMDP Loop: Plan -> Retrieve -> Reason -> Constrain -> Execute
 * Constrained Markov Decision Process for autonomous SRE
 */

export interface PlanStep {
  step: number;
  action: string | ProposedAction;
  reflexors: string[]; // Which tools to use
  description: string;
}

export interface CMDPPlan {
  steps: PlanStep[];
  reasoning: string;
}

export interface ExecutionLogEntry {
  step: number;
  action: ProposedAction;
  validationRuleBased: { allowed: boolean; violations: string[] };
  verificationAgent: VerificationResult;
  complianceCheck?: {
    isCompliant: boolean;
    status: 'passed' | 'failed' | 'warning';
    score: number;
    violations: string[];
    signature: string;
    logId: string;
  };
  executionStatus?: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  timestamp: Date;
}

export interface VerificationResult {
  approved: boolean;
  reason?: string;
  warning?: string;
}

/**
 * Step 1: PLAN - Generate chain of thought plan
 */
export async function planChain({
  context,
  modelId = 'gpt-4o-mini',
}: {
  context: {
    incident?: any;
    metrics?: any[];
    recentLogs?: any[];
    query?: string;
  };
  modelId?: string;
}): Promise<CMDPPlan> {
  const model = openai(modelId);

  const planPrompt = `You are a Site Reliability Engineer (SRE) using a Constrained Markov Decision Process (CMDP).

Given this context:
${JSON.stringify(context, null, 2)}

Create a detailed plan to resolve this issue.
Break down your plan into sequential steps.
For each step, identify what Reflexors (tools) you need to use (e.g., "fetch-logs", "analyze-screenshot", "check-metrics").

Available Reflexors:
- fetch-logs: Retrieve service logs
- analyze-screenshot: Analyze infrastructure diagrams/dashboards
- check-metrics: Query performance metrics
- execute-action: Execute remediation action

Output as JSON with this structure:
{
  "steps": [
    {
      "step": 1,
      "action": "SCALE_K8S",
      "reflexors": ["check-metrics", "fetch-logs"],
      "description": "Check metrics and logs before scaling"
    }
  ],
  "reasoning": "Why this plan was chosen"
}`;

  try {
    const result = await generateText({
      model,
      prompt: planPrompt,
      temperature: 0.1, // Low temp for structured planning
      maxTokens: 1000,
    });

    // Parse JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        steps: parsed.steps || [],
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    }

    // Fallback: create a simple plan
    return {
      steps: [
        {
          step: 1,
          action: 'RESTART_SERVICE',
          reflexors: ['check-metrics'],
          description: 'Check metrics and restart service if needed',
        },
      ],
      reasoning: 'Default plan generated',
    };
  } catch (error: any) {
    console.error('Plan generation error:', error);
    throw new Error(`Failed to generate plan: ${error.message}`);
  }
}

/**
 * Step 2: RETRIEVE - Fetch evidence using Reflexors
 */
async function retrieveEvidence(
  reflexors: string[],
  context: any
): Promise<Record<string, any>> {
  const evidenceStore: Record<string, any> = {};

  for (const reflexor of reflexors) {
    try {
      if (reflexor === 'fetch-logs') {
        // Fetch service logs
        const recentLogs = await db.auditLog.findMany({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
            },
          },
          take: 10,
          orderBy: { timestamp: 'desc' },
        });
        evidenceStore.logs = recentLogs.map((log) => ({
          action: log.action,
          table: log.tableName,
          timestamp: log.timestamp,
        }));
      } else if (reflexor === 'check-metrics') {
        // Check metrics (simulated)
        evidenceStore.metrics = {
          latency: 2450, // ms
          errorRate: 0.05,
          cpuUsage: 85,
          timestamp: new Date(),
        };
      } else if (reflexor === 'analyze-screenshot') {
        // Analyze screenshot (would use vision service)
        if (context.imageUrl) {
          const { encodeVisualContext } = await import('./vision-service');
          const visualEmbedding = await encodeVisualContext(context.imageUrl);
          evidenceStore.screenshot = {
            analyzed: true,
            embedding: visualEmbedding.slice(0, 10), // Preview
          };
        }
      }
    } catch (error: any) {
      console.error(`Error in reflexor ${reflexor}:`, error);
      evidenceStore[reflexor] = { error: error.message };
    }
  }

  return evidenceStore;
}

/**
 * Step 3: REASON - Analyze evidence against plan
 */
async function reasonAgainstEvidence({
  step,
  evidenceStore,
  proposedAction,
  modelId = 'gpt-4o-mini',
}: {
  step: PlanStep;
  evidenceStore: Record<string, any>;
  proposedAction: ProposedAction;
  modelId?: string;
}): Promise<{ proceed: boolean; reasoning: string }> {
  const model = openai(modelId);

  const reasoningPrompt = `You are executing Step ${step.step}: "${step.description}".

Here is the Evidence retrieved:
${JSON.stringify(evidenceStore, null, 2)}

Proposed Action:
${JSON.stringify(proposedAction, null, 2)}

Analyze this evidence.
Does it support the proposed action?
If not, you must HALT and re-plan.

Output as JSON: { "reasoning": "...", "proceed": true/false }`;

  try {
    const result = await generateText({
      model,
      prompt: reasoningPrompt,
      temperature: 0.2,
      maxTokens: 300,
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        proceed: parsed.proceed === true,
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    }

    // Default to proceed if unclear
    return {
      proceed: true,
      reasoning: 'Evidence analysis completed',
    };
  } catch (error: any) {
    console.error('Reasoning error:', error);
    return {
      proceed: false,
      reasoning: `Reasoning failed: ${error.message}`,
    };
  }
}

/**
 * Main CMDP Execution Loop
 */
export async function executeCMDPChain({
  plan,
  context,
  workspaceId,
  incidentId,
}: {
  plan: CMDPPlan;
  context: any;
  workspaceId?: string;
  incidentId?: string;
}): Promise<ExecutionLogEntry[]> {
  const executionLog: ExecutionLogEntry[] = [];
  let evidenceStore: Record<string, any> = {};

  // Loop through the Plan
  for (const step of plan.steps) {
    try {
      // Step 2: RETRIEVE Evidence
      const retrievedEvidence = await retrieveEvidence(step.reflexors, context);
      evidenceStore = { ...evidenceStore, ...retrievedEvidence };

      // Parse proposed action from step
      let proposedAction: ProposedAction;

      if (typeof step.action === 'string') {
        // Try to parse action string
        const actionMap: Record<string, ProposedAction['type']> = {
          'SCALE_K8S': 'SCALE_K8S',
          'ROLLBACK_DB': 'ROLLBACK_DB',
          'RESTART_SERVICE': 'RESTART_SERVICE',
          'DELETE_LOGS': 'DELETE_LOGS',
          'PAUSE_PIPELINE': 'PAUSE_PIPELINE',
        };

        const actionType = actionMap[step.action] || 'RESTART_SERVICE';
        proposedAction = {
          type: actionType,
          params: {
            target: context.incident?.thread?.channel?.name || 'default',
            reason: step.description,
          },
        };
      } else {
        proposedAction = step.action;
      }

      // Step 3: REASON against evidence
      const reasoningResult = await reasonAgainstEvidence({
        step,
        evidenceStore,
        proposedAction,
      });

      if (!reasoningResult.proceed) {
        executionLog.push({
          step: step.step,
          action: proposedAction,
          validationRuleBased: { allowed: false, violations: ['Evidence mismatch'] },
          verificationAgent: { approved: false, reason: reasoningResult.reasoning },
          executionStatus: 'SKIPPED',
          timestamp: new Date(),
        });
        break; // Stop the plan
      }

      // STAGE 1: RULE-BASED VALIDATION (The Gatekeeper)
      const rulesResult = validateProposedAction(proposedAction, GovernancePolicies);

      executionLog.push({
        step: step.step,
        action: proposedAction,
        validationRuleBased: rulesResult,
        verificationAgent: { approved: true }, // Tentatively true until Agent checks
        timestamp: new Date(),
      });

      // STAGE 2: LLM-BASED VERIFICATION (The Second Opinion)
      let agentResult = { approved: false, reason: 'Not verified' };
      if (rulesResult.allowed) {
        agentResult = await verifyExecution({
          evidenceStore,
          proposedAction,
          modelId: 'gpt-4o-mini',
        });

        executionLog[executionLog.length - 1].verificationAgent = agentResult;
      }

      // STAGE 3: DECISION MATRIX
      const rulesFailed = !rulesResult.allowed;
      const agentRejected = !agentResult.approved;

      // 1. Hard Fail (Rules): Immediate Stop
      if (rulesFailed) {
        console.log(`[CMDP] STEP ${step.step} REJECTED: Rule-based validation failed.`);
        executionLog[executionLog.length - 1].executionStatus = 'SKIPPED';
        break; // Stop the plan
      }

      // 2. Soft Fail (Agent): Stop if rejected
      if (agentRejected) {
        console.log(`[CMDP] STEP ${step.step} REJECTED: Verification Agent rejected action.`);
        executionLog[executionLog.length - 1].executionStatus = 'SKIPPED';
        break; // Stop the plan
      }

      // 3. Safe to Execute
      if (rulesResult.allowed && executionLog[executionLog.length - 1].verificationAgent.approved) {
        console.log(`[CMDP] STEP ${step.step} APPROVED: Rule-based & Agent-based.`);

        // STAGE 4: EXECUTE (Real Ops)
        try {
          // Map CMDP action types to executeActionJitter format
          const actionMap: Record<string, string> = {
            'SCALE_K8S': 'SCALE_UP',
            'ROLLBACK_DB': 'ROLLBACK',
            'RESTART_SERVICE': 'RESTART_SERVICE',
            'DELETE_LOGS': 'DELETE_LOGS',
            'PAUSE_PIPELINE': 'PAUSE_PIPELINE',
          };

          const actionType = actionMap[proposedAction.type] || proposedAction.type;
          const result = await executeActionJitter({
            incidentId: incidentId || '',
            action: actionType,
            workspaceId,
          });

          if (result.success) {
            executionLog[executionLog.length - 1].executionStatus = 'SUCCESS';
          } else {
            executionLog[executionLog.length - 1].executionStatus = 'FAILED';
            break; // Stop on execution failure
          }
        } catch (error: any) {
          console.error(`[CMDP] STEP ${step.step} EXECUTION FAILED:`, error);
          executionLog[executionLog.length - 1].executionStatus = 'FAILED';
          break; // Stop on error
        }
      }
    } catch (error: any) {
      console.error('[CMDP] Error processing step:', error);
      executionLog.push({
        step: step.step,
        action: { type: 'RESTART_SERVICE', params: { target: 'unknown' } },
        validationRuleBased: { allowed: false, violations: [error.message] },
        verificationAgent: { approved: false, reason: error.message },
        executionStatus: 'FAILED',
        timestamp: new Date(),
      });
      break;
    }
  }

  return executionLog;
}
