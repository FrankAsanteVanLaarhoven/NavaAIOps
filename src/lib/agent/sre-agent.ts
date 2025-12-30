import { db } from '@/lib/db';
import {
  detectAnomalies,
  proposeRemediation,
  executeRemediation,
  verifyRemediation,
  closeIncident,
  type Anomaly,
} from './sre-tools';
import { planChain, executeCMDPChain } from '@/lib/ai/cmdp-loop';

/**
 * AI SRE Agent
 * Autonomous Site Reliability Engineer that detects, remediates, and verifies issues
 * with human approval gates at critical points
 */

export interface SREAgentConfig {
  workspaceId?: string;
  severityThreshold?: string; // "CRITICAL" triggers immediate action
  userId?: string; // User who initiated the agent
}

export interface SREAgentEvent {
  phase: 'DETECTION' | 'PROPOSAL_FIX' | 'EXECUTION_GATE' | 'EXECUTION' | 'VERIFICATION_GATE' | 'VERIFICATION' | 'CLOSED' | 'IDLE' | 'ERROR';
  status: 'IN_PROGRESS' | 'PENDING_HUMAN_APPROVAL' | 'SUCCESS' | 'FAILED' | 'REJECTED' | 'NO_ISSUES';
  content: string;
  metadata?: {
    scriptId?: string;
    anomalyIds?: string[];
    resultId?: string;
    incidentId?: string;
    executionId?: string;
    executionLog?: any[];
    allApproved?: boolean;
    cmdpPlan?: any;
    [key: string]: any;
  };
  timestamp: Date;
}

/**
 * Wait for human approval (polls database for approval status)
 */
async function waitForApproval(
  updateId: string,
  timeout: number = 300000 // 5 minutes timeout
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const update = await db.incidentUpdate.findUnique({
      where: { id: updateId },
    });

    if (update?.status === 'SUCCESS' && update.approvedBy) {
      return true;
    }

    if (update?.status === 'REJECTED') {
      return false;
    }

    // Poll every 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return false; // Timeout
}

/**
 * Main SRE Agent Loop
 * This is an async generator that yields events as it progresses
 */
export async function* runSREAgent(
  config: SREAgentConfig
): AsyncGenerator<SREAgentEvent, void, unknown> {
  const { workspaceId, severityThreshold = 'MEDIUM', userId } = config;

  try {
    // Phase 1: Detection
    yield {
      phase: 'DETECTION',
      status: 'IN_PROGRESS',
      content: '🔍 Scanning for anomalies...',
      timestamp: new Date(),
    };

    const anomalies = await detectAnomalies(workspaceId || '');

    if (!anomalies || anomalies.length === 0) {
      yield {
        phase: 'IDLE',
        status: 'NO_ISSUES',
        content: '✅ System healthy. No anomalies detected.',
        timestamp: new Date(),
      };
      return;
    }

    // Determine severity
    const highestSeverity = Math.max(...anomalies.map((a) => a.severityScore));
    const isCritical =
      severityThreshold === 'CRITICAL' || highestSeverity >= 8.0;

    yield {
      phase: 'DETECTION',
      status: 'SUCCESS',
      content: `⚠️ **Detected ${anomalies.length} anomaly/anomalies**\n\n**Highest Severity:** ${highestSeverity.toFixed(1)}/10 (${isCritical ? 'CRITICAL' : 'HIGH'})\n\n${anomalies.map((a) => `- ${a.description}`).join('\n')}`,
      metadata: {
        anomalyIds: anomalies.map((a) => a.id),
        severityScore: highestSeverity,
      },
      timestamp: new Date(),
    };

    // Phase 2: CMDP Planning (Plan -> Retrieve -> Reason -> Constrain)
    yield {
      phase: 'PROPOSAL_FIX',
      status: 'IN_PROGRESS',
      content: '🧠 CMDP Planning: Creating chain of thought plan...',
      timestamp: new Date(),
    };

    // Use CMDP to create a structured plan
    const cmdpPlan = await planChain({
      context: {
        incident: {
          anomalies,
          workspaceId,
        },
        metrics: anomalies.map((a) => ({
          metric: a.metric,
          value: a.value,
          threshold: a.threshold,
        })),
        query: `Resolve ${anomalies.length} detected anomaly/anomalies`,
      },
    });

    yield {
      phase: 'PROPOSAL_FIX',
      status: 'SUCCESS',
      content: `✅ CMDP Plan Generated:\n\n${cmdpPlan.steps.map((s, i) => `${i + 1}. ${s.description} (Reflexors: ${s.reflexors.join(', ')})`).join('\n')}\n\nReasoning: ${cmdpPlan.reasoning}`,
      metadata: {
        plan: cmdpPlan,
      },
      timestamp: new Date(),
    };

    // Fallback: Also get traditional remediation plan for compatibility
    const remediationPlan = await proposeRemediation(anomalies, workspaceId);

    // Create or find incident thread
    let incidentThreadId: string | null = null;

    // Try to find existing incident for these anomalies
    const existingIncident = await db.incidentData.findFirst({
      where: {
        status: {
          in: ['investigating', 'identified'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingIncident) {
      incidentThreadId = existingIncident.threadId;
    } else {
      // Create new incident thread
      const incidentChannel = await db.channel.findFirst({
        where: { type: 'incident' },
      });

      if (!incidentChannel) {
        throw new Error('No incident channel found');
      }

      const newThread = await db.thread.create({
        data: {
          channelId: incidentChannel.id,
          title: `Auto-detected: ${anomalies[0].description.substring(0, 50)}`,
        },
      });

      await db.incidentData.create({
        data: {
          threadId: newThread.id,
          status: 'investigating',
          severity: isCritical ? 'sev-0' : 'sev-1',
          impact: anomalies.map((a) => a.description).join('; '),
        },
      });

      incidentThreadId = newThread.id;
    }

    // Phase 3: Gate 1 - Wait for Human Approval to Execute CMDP Plan
    const executionGateUpdate = await db.incidentUpdate.create({
      data: {
        incidentId: incidentThreadId,
        phase: 'EXECUTION_GATE',
        status: 'PENDING_HUMAN_APPROVAL',
        actor: 'AI_AGENT',
        content: JSON.stringify({
          message: `⚠️ **Action Required (CMDP):** I have detected ${anomalies.length} issue(s).\n\n**Severity:** ${isCritical ? 'CRITICAL' : 'HIGH'} (${highestSeverity.toFixed(2)}/10).\n\n**CMDP Plan:**\n${cmdpPlan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}\n\n**Traditional Remediation:** ${remediationPlan.scriptName}\n\n**Risk:** ${remediationPlan.risk}\n\n**Estimated Duration:** ${remediationPlan.estimatedDuration}`,
          scriptId: remediationPlan.scriptId,
          scriptName: remediationPlan.scriptName,
          cmdpPlan: cmdpPlan,
        }),
        metadata: JSON.stringify({
          scriptId: remediationPlan.scriptId,
          anomalyIds: anomalies.map((a) => a.id),
          cmdpPlanId: `plan-${Date.now()}`,
        }),
        timestamp: new Date(),
      },
    });

    yield {
      phase: 'EXECUTION_GATE',
      status: 'PENDING_HUMAN_APPROVAL',
      content: `⚠️ **Action Required (CMDP):** I have detected ${anomalies.length} issue(s).\n\n**Severity:** ${isCritical ? 'CRITICAL' : 'HIGH'} (${highestSeverity.toFixed(2)}/10).\n\n**CMDP Plan:**\n${cmdpPlan.steps.map((s, i) => `${i + 1}. ${s.description} (${s.reflexors.join(', ')})`).join('\n')}\n\n**Reasoning:** ${cmdpPlan.reasoning}\n\n⏸️ **Waiting for human approval to execute CMDP plan...**`,
      metadata: {
        scriptId: remediationPlan.scriptId,
        anomalyIds: anomalies.map((a) => a.id),
        incidentId: incidentThreadId,
        updateId: executionGateUpdate.id,
        cmdpPlan: cmdpPlan,
      },
      timestamp: new Date(),
    };

    // --- STOP HERE. The loop is paused. The human must approve. ---
    const approved = await waitForApproval(executionGateUpdate.id);

    if (!approved) {
      yield {
        phase: 'EXECUTION_GATE',
        status: 'REJECTED',
        content: '❌ **Remediation rejected by human operator.**\n\nAgent stopped. Manual intervention required.',
        metadata: {
          incidentId: incidentThreadId,
        },
        timestamp: new Date(),
      };
      return;
    }

    // Phase 4: Execute CMDP Chain (with Validation & Verification)
    yield {
      phase: 'EXECUTION',
      status: 'IN_PROGRESS',
      content: `🛠️ **Executing CMDP Chain:**\n\nExecuting plan with validation and verification...`,
      metadata: {
        scriptId: remediationPlan.scriptId,
        incidentId: incidentThreadId,
        cmdpPlan: cmdpPlan,
      },
      timestamp: new Date(),
    };

    // Execute CMDP chain (includes validation, verification, and execution)
    const executionLog = await executeCMDPChain({
      plan: cmdpPlan,
      context: {
        incident: {
          id: incidentThreadId,
          anomalies,
        },
        metrics: anomalies.map((a) => ({
          metric: a.metric,
          value: a.value,
        })),
      },
      workspaceId,
      incidentId: incidentThreadId,
    });

    // Check if all steps were approved and executed
    const allApproved = executionLog.every(
      (log) => log.validationRuleBased.allowed && log.verificationAgent.approved
    );
    const allSucceeded = executionLog.every(
      (log) => log.executionStatus === 'SUCCESS'
    );

    // Also execute traditional remediation for compatibility
    const executionResult = await executeRemediation(remediationPlan.scriptId, userId);

    const executionUpdate = await db.incidentUpdate.create({
      data: {
        incidentId: incidentThreadId!,
        phase: 'EXECUTION',
        status: allSucceeded && executionResult.success ? 'SUCCESS' : 'FAILED',
        actor: 'AI_AGENT',
        content: JSON.stringify({
          message: `🛠️ **CMDP Execution Log:**\n\n**Steps Executed:** ${executionLog.length}\n**All Approved:** ${allApproved ? 'YES' : 'NO'}\n**All Succeeded:** ${allSucceeded ? 'YES' : 'NO'}\n\n**Traditional Remediation:**\n\`\`\`\n${executionResult.log}\n\`\`\`\n\n**Status:** ${executionResult.success ? 'SUCCESS' : 'FAILED'}`,
          executionId: executionResult.id,
          exitCode: executionResult.exitCode,
          executionLog,
        }),
        metadata: JSON.stringify({
          resultId: executionResult.id,
          exitCode: executionResult.exitCode,
          executionLog,
          allApproved,
          allSucceeded,
        }),
        timestamp: new Date(),
      },
    });

    yield {
      phase: 'EXECUTION',
      status: allSucceeded && executionResult.success ? 'SUCCESS' : 'FAILED',
      content: `🛠️ **CMDP Execution Complete:**\n\n**Steps:** ${executionLog.length}\n**Validation:** ${allApproved ? '✅ All Approved' : '❌ Some Rejected'}\n**Execution:** ${allSucceeded ? '✅ All Succeeded' : '❌ Some Failed'}\n\n**Traditional Remediation:**\n\`\`\`\n${executionResult.log}\n\`\`\`\n\n**Status:** ${executionResult.success ? 'SUCCESS ✅' : 'FAILED ❌'}`,
      metadata: {
        resultId: executionResult.id,
        executionId: executionResult.id,
        incidentId: incidentThreadId,
        updateId: executionUpdate.id,
        executionLog,
        allApproved,
      },
      timestamp: new Date(),
    };

    if (!executionResult.success) {
      yield {
        phase: 'ERROR',
        status: 'FAILED',
        content: '❌ **Remediation execution failed.**\n\nManual intervention required.',
        metadata: {
          incidentId: incidentThreadId,
        },
        timestamp: new Date(),
      };
      return;
    }

    // Phase 5: Gate 2 - Wait for Human Verification
    yield {
      phase: 'VERIFICATION_GATE',
      status: 'PENDING_HUMAN_APPROVAL',
      content: `🔍 **Verification Required:**\n\nExecution completed. Please verify that the remediation was successful by checking:\n- Metrics have improved\n- System is stable\n- No new errors\n\n⏸️ **Waiting for human verification...**`,
      metadata: {
        executionId: executionResult.id,
        incidentId: incidentThreadId,
      },
      timestamp: new Date(),
    };

    // Phase 6: Automated Verification (runs in parallel with human check)
    yield {
      phase: 'VERIFICATION',
      status: 'IN_PROGRESS',
      content: '🔍 Verifying remediation by re-checking metrics...',
      timestamp: new Date(),
    };

    const verificationResult = await verifyRemediation(
      anomalies.map((a) => a.id),
      executionResult.id
    );

    const verificationUpdate = await db.incidentUpdate.create({
      data: {
        incidentId: incidentThreadId!,
        phase: 'VERIFICATION',
        status: verificationResult.verified ? 'SUCCESS' : 'FAILED',
        actor: 'AI_AGENT',
        content: JSON.stringify({
          message: verificationResult.message,
          verified: verificationResult.verified,
          improvement: verificationResult.improvement,
          newMetricValue: verificationResult.newMetricValue,
        }),
        timestamp: new Date(),
      },
    });

    yield {
      phase: 'VERIFICATION',
      status: verificationResult.verified ? 'SUCCESS' : 'FAILED',
      content: `🔍 **Verification Result:**\n\n${verificationResult.message}\n\n**Improvement:** ${verificationResult.improvement > 0 ? '+' : ''}${verificationResult.improvement.toFixed(1)}%`,
      metadata: {
        incidentId: incidentThreadId,
        updateId: verificationUpdate.id,
        verified: verificationResult.verified,
      },
      timestamp: new Date(),
    };

    if (!verificationResult.verified) {
      yield {
        phase: 'ERROR',
        status: 'FAILED',
        content: '❌ **Verification failed.**\n\nRemediation did not improve metrics. Manual intervention may be required.',
        metadata: {
          incidentId: incidentThreadId,
        },
        timestamp: new Date(),
      };
      return;
    }

    // Phase 7: Close Incident (Gate 3 - Optional human check)
    yield {
      phase: 'CLOSED',
      status: 'SUCCESS',
      content: `✅ **Job Tail Completed:**\n\nIncident resolved successfully.\n\n**Summary:**\n- Detected ${anomalies.length} anomaly/anomalies\n- Executed: ${remediationPlan.scriptName}\n- Verification: Metrics improved by ${verificationResult.improvement.toFixed(1)}%\n- System is now stable\n\nIncident ${incidentThreadId} closed.`,
      metadata: {
        incidentId: incidentThreadId,
      },
      timestamp: new Date(),
    };

    // Actually close the incident
    await closeIncident(incidentThreadId!, userId);
  } catch (error: any) {
    yield {
      phase: 'ERROR',
      status: 'FAILED',
      content: `❌ **Error:** ${error.message || 'Unknown error occurred'}`,
      timestamp: new Date(),
    };
  }
}
