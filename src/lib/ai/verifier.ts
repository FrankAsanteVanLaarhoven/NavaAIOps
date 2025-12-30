import { db } from '@/lib/db';
import { createHash } from 'crypto';

/**
 * Verification Engine
 * Checks compliance against Policies and Regulations
 */

export interface CheckComplianceInput {
  incidentId: string;
  proposedActions: {
    type: string;
    target: string;
    params: any;
  }[];
  workspaceId?: string;
}

export interface ComplianceResult {
  isCompliant: boolean;
  status: 'passed' | 'failed' | 'warning';
  score: number;
  violations: {
    blocked: string[];
    warnings: string[];
  };
  signature: string;
  logId: string;
}

/**
 * Check compliance against policies and regulations
 */
export async function checkCompliance({
  input,
  workspaceId,
}: {
  input: CheckComplianceInput;
  workspaceId?: string;
}): Promise<ComplianceResult> {
  const { incidentId, proposedActions } = input;

  // Fetch relevant Policies & Regulations
  const policies = await db.policy.findMany({
    where: {
      isActive: true,
      ...(workspaceId ? { workspaceId } : {}),
    },
  });

  const regulations = await db.regulation.findMany({
    where: {
      isActive: true,
      ...(workspaceId ? { workspaceId } : {}),
    },
  });

  const violations: {
    blocked: string[];
    warnings: string[];
  } = {
    blocked: [],
    warnings: [],
  };

  let score = 1.0; // Start perfect

  // Check each proposed action
  for (const action of proposedActions) {
    // Check Policies
    for (const policy of policies) {
      try {
        const policyContent = typeof policy.content === 'string'
          ? JSON.parse(policy.content)
          : policy.content;

        // Data Retention Policy Check
        if (policy.category === 'governance' && policy.name.includes('Data Retention')) {
          if (action.type === 'DELETE_LOGS' || action.type === 'delete_channel') {
            const minAge = policyContent.minRetentionDays || 30;

            // Get channel/thread metadata
            const thread = await db.thread.findUnique({
              where: { id: action.target },
            });

            if (thread && thread.createdAt) {
              const ageInDays =
                (Date.now() - new Date(thread.createdAt).getTime()) / (1000 * 60 * 60 * 24);
              if (ageInDays < minAge) {
                violations.blocked.push(
                  `Governance Violation: Target "${action.target}" is ${ageInDays.toFixed(1)} days old. Policy requires ${minAge} days retention.`
                );
                score -= 1.0; // Critical failure
              }
            }
          }
        }

        // SLA Policy Check
        if (policy.category === 'sla') {
          // Check if action would violate SLA commitments
          if (action.type === 'PAUSE_PIPELINE' || action.type === 'ROLLBACK_DB') {
            violations.warnings.push(
              `SLA Warning: Action "${action.type}" may impact service availability. Review SLA commitments.`
            );
            score -= 0.2;
          }
        }
      } catch (error: any) {
        console.error(`Error checking policy ${policy.name}:`, error);
      }
    }

    // Check Regulations
    for (const regulation of regulations) {
      try {
        // Resource Quota Check
        if (regulation.type === 'resource_quota' && regulation.unit === 'percent') {
          if (action.type === 'SCALE_K8S' || action.type === 'SCALE_UP') {
            // In production, fetch actual metrics from Prometheus
            // For now, simulate check
            const currentUsage = 75; // Simulated CPU usage
            if (currentUsage >= regulation.limitValue) {
              violations.warnings.push(
                `Regulation Warning: Action "${action.type}" on "${action.target}" would push resource usage to ${currentUsage}%. Limit is ${regulation.limitValue}%.`
              );
              score -= 0.2;
            }
          }
        }

        // Rate Limit Check
        if (regulation.type === 'rate_limit') {
          // Check if action would exceed rate limits
          if (action.type === 'SCALE_K8S') {
            const scaleValue = action.params?.scaleTo || action.params?.replicas || 1;
            if (scaleValue > regulation.limitValue) {
              violations.blocked.push(
                `Regulation Violation: Scaling to ${scaleValue} exceeds limit of ${regulation.limitValue} (${regulation.unit}).`
              );
              score -= 1.0;
            }
          }
        }

        // Cost Limit Check
        if (regulation.type === 'cost_limit' && regulation.unit === 'dollars') {
          // Estimate cost of action
          const estimatedCost = action.type === 'SCALE_K8S'
            ? (action.params?.scaleTo || 1) * 100 // $100 per instance
            : 0;

          if (estimatedCost > regulation.limitValue) {
            violations.blocked.push(
              `Cost Violation: Estimated cost ($${estimatedCost}) exceeds limit ($${regulation.limitValue}).`
            );
            score -= 1.0;
          }
        }
      } catch (error: any) {
        console.error(`Error checking regulation ${regulation.name}:`, error);
      }
    }
  }

  // Final judgment
  const isCompliant = violations.blocked.length === 0;
  const status: 'passed' | 'failed' | 'warning' =
    violations.blocked.length > 0
      ? 'failed'
      : violations.warnings.length > 0
      ? 'warning'
      : 'passed';

  // Generate Signature (Tamper-Evident)
  const payload = JSON.stringify({
    incidentId,
    actions: proposedActions,
    timestamp: Date.now(),
    violations,
  });
  const signature = createHash('sha256').update(payload).digest('hex');

  // Log the verification attempt
  const complianceLog = await db.complianceLog.create({
    data: {
      incidentId,
      policyId: policies[0]?.id || 'default-policy',
      regulationId: violations.blocked.length > 0 ? regulations[0]?.id || null : null,
      status,
      reason:
        violations.blocked.join('; ') ||
        violations.warnings.join('; ') ||
        'Compliant',
      score: Math.max(0, Math.min(1, score)),
      evidence: JSON.stringify({
        violations,
        proposedActions,
        regulations: regulations.map((r) => ({
          name: r.name,
          type: r.type,
          limitValue: r.limitValue,
        })),
      }),
      signature,
      certifiedBy: 'system',
      timestamp: new Date(),
    },
  });

  return {
    isCompliant,
    status,
    score: Math.max(0, Math.min(1, score)),
    violations,
    signature,
    logId: complianceLog.id,
  };
}
