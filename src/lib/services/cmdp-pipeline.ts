import { z } from 'zod';
import { db } from '@/lib/db';
import { checkCompliance } from '@/lib/ai/verifier';
import { getResourceMetrics } from '@/lib/ai/resource-guard';
import { executeActionJitter } from '@/lib/ai/realtime-ops';

export const CMDPInput = z.object({
  context: z.any(),
  incidentId: z.string(),
  workspaceId: z.string(),
});

export type CMDPInput = z.infer<typeof CMDPInput>;

// Helper functions for evidence retrieval
async function fetchServiceLogs(serviceId: string, minutes: number = 10): Promise<string[]> {
  // In production, query Prometheus, CloudWatch, or log aggregation service
  const logs = await db.auditLog.findMany({
    where: {
      tableName: serviceId,
      timestamp: {
        gte: new Date(Date.now() - minutes * 60 * 1000),
      },
    },
    take: 50,
    orderBy: { timestamp: 'desc' },
  });

  return logs.map((log) => JSON.stringify(log.metadata || {}));
}

async function analyzeScreenshot(imageUrl: string): Promise<any> {
  // In production, use vision service to analyze screenshots
  // For now, return mock data
  return {
    anomalyDetected: false,
    description: 'Screenshot analysis not implemented',
  };
}

/**
 * Execute the full CMDP Pipeline
 * Plan -> Search -> Reason -> Verify -> Constrain -> Execute
 */
export async function executeCMDPPipeline({ input }: { input: CMDPInput }) {
  try {
    // 1. PLAN: Get structured plan from O3-Mini
    const planResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: input.context,
        incidentId: input.incidentId,
      }),
    });

    if (!planResponse.ok) {
      throw new Error(`Plan generation failed: ${planResponse.statusText}`);
    }

    // Parse streaming response (simplified - in production, handle streaming properly)
    const planText = await planResponse.text();
    let plan: any;
    
    try {
      // Try to parse as JSON first
      plan = JSON.parse(planText);
    } catch {
      // If streaming, extract JSON from text stream
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse plan from response');
      }
    }

    if (!plan.steps || !Array.isArray(plan.steps)) {
      throw new Error('Invalid plan structure: missing steps array');
    }

    const verifiedSteps: any[] = [];
    let overallComplianceScore = 1.0;

    // Process each step in the plan
    for (const step of plan.steps) {
      // 2. SEARCH: Retrieve Evidence (Reflexors)
      let evidence: any = {};
      
      if (step.action === 'fetch-logs' && step.params?.serviceId) {
        evidence.logs = await fetchServiceLogs(step.params.serviceId, step.params.window || 10);
      } else if (step.action === 'analyze-screenshot' && step.params?.imageUrl) {
        evidence.screenshot = await analyzeScreenshot(step.params.imageUrl);
      } else if (step.action === 'check-metrics' && step.params?.metricName) {
        const metrics = await getResourceMetrics({
          workspaceId: input.workspaceId,
          metricName: step.params.metricName,
        });
        evidence.metrics = metrics;
      }

      // 3. REASON: Analyze evidence with Reasoner (GPT-4o-mini-sre)
      const reasonResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: input.incidentId,
        }),
      });

      if (!reasonResponse.ok) {
        throw new Error(`Reasoning failed: ${reasonResponse.statusText}`);
      }

      const reasoningText = await reasonResponse.text();
      step.reasoning = reasoningText;

      // 4. CONSTRAIN/VERIFY: Check compliance
      const complianceResult = await checkCompliance({
        incidentId: input.incidentId,
        proposedActions: [
          {
            type: step.action || 'UNKNOWN',
            target: step.params?.target || step.params?.serviceId || 'unknown',
            params: step.params || {},
          },
        ],
        workspaceId: input.workspaceId,
      });

      overallComplianceScore *= complianceResult.score; // Multiply scores (0.0 to 1.0)

      if (!complianceResult.isCompliant) {
        // Violation: Stop chain, return failure reason
        return {
          status: 'failed',
          error: 'Verification Failed. Action violates Policy/Regulation.',
          violations: complianceResult.violations,
          score: overallComplianceScore,
          step_id: step.step || step.step_id,
          reasoning: step.reasoning,
        };
      }

      verifiedSteps.push({
        step_id: step.step || step.step_id,
        reasoning: step.reasoning,
        evidence,
        action: step,
      });
    }

    // 5. CONSTRAINT: Final Self-Correction Check
    // (If model decided to proceed despite risk, we stop it here)
    const hasExecuteAction = plan.steps.some((s: any) => 
      s.action === 'execute-action' || s.action === 'scale_up_instances' || s.reflexor === 'ACTION'
    );

    if (hasExecuteAction && overallComplianceScore < 0.5) {
      return {
        status: 'failed',
        error: 'Overall compliance score too low to execute autonomously.',
        verified_steps: verifiedSteps,
        overall_compliance_score: overallComplianceScore,
      };
    }

    // 6. EXECUTE: Action Jitters
    const executeStep = plan.steps.find((s: any) => 
      s.action === 'scale_up_instances' || s.action === 'execute-action' || s.reflexor === 'ACTION'
    );

    if (executeStep) {
      await executeActionJitter({
        incidentId: input.incidentId,
        action: executeStep.action || 'SCALE_K8S',
        workspaceId: input.workspaceId,
        command: executeStep.params?.command,
      });
    }

    return {
      status: 'success',
      verified_steps: verifiedSteps,
      overall_compliance_score: overallComplianceScore,
      plan_id: plan.id,
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message || 'CMDP pipeline execution failed',
    };
  }
}
