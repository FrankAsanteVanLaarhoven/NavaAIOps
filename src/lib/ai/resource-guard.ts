import { db } from '@/lib/db';

/**
 * Resource Guardrails
 * Checks resource usage before executing actions
 */

export interface ResourceMetrics {
  cpuPercent: number;
  memoryPercent: number;
  diskIOPS: number;
  networkIO: number;
  timestamp: Date;
}

/**
 * Get resource metrics for a target (simulated - in production, query Prometheus)
 */
export async function getResourceMetrics(targetId: string): Promise<ResourceMetrics | null> {
  try {
    // In production, you would:
    // 1. Query Prometheus API: GET /api/v1/query?query=cpu_usage{target="${targetId}"}
    // 2. Query CloudWatch: GetMetricStatistics
    // 3. Query Grafana: /api/datasources/proxy/...

    // For now, simulate metrics based on target
    const target = await db.thread.findUnique({
      where: { id: targetId },
      include: { channel: true },
    });

    if (!target) {
      return null;
    }

    // Simulate: production clusters have higher load
    const isProduction = target.channel?.name?.toLowerCase().includes('prod') || false;
    const baseLoad = isProduction ? 0.4 : 0.2;

    return {
      cpuPercent: baseLoad + Math.random() * 0.4, // 20% - 80%
      memoryPercent: baseLoad + Math.random() * 0.3,
      diskIOPS: baseLoad + Math.random() * 0.2,
      networkIO: baseLoad + Math.random() * 0.25,
      timestamp: new Date(),
    };
  } catch (error: any) {
    console.error('Error fetching resource metrics:', error);
    return null;
  }
}

/**
 * Check if action would violate resource limits
 */
export async function checkResourceLimits({
  action,
  targetId,
  regulations,
}: {
  action: { type: string; params: any };
  targetId: string;
  regulations: Array<{ type: string; limitValue: number; unit: string }>;
}): Promise<{
  allowed: boolean;
  violations: string[];
  metrics?: ResourceMetrics;
}> {
  const metrics = await getResourceMetrics(targetId);

  if (!metrics) {
    return {
      allowed: true, // Allow if metrics unavailable
      violations: [],
    };
  }

  const violations: string[] = [];

  // Check CPU limit
  const cpuRegulation = regulations.find(
    (r) => r.type === 'resource_quota' && r.unit === 'percent'
  );
  if (cpuRegulation && metrics.cpuPercent >= cpuRegulation.limitValue) {
    violations.push(
      `CPU usage (${(metrics.cpuPercent * 100).toFixed(1)}%) exceeds limit (${cpuRegulation.limitValue}%)`
    );
  }

  // Check memory limit
  if (metrics.memoryPercent >= 0.9) {
    violations.push(
      `Memory usage (${(metrics.memoryPercent * 100).toFixed(1)}%) is critically high (>90%)`
    );
  }

  // Check if scaling would exceed limits
  if (action.type === 'SCALE_K8S' || action.type === 'SCALE_UP') {
    const scaleValue = action.params?.scaleTo || action.params?.replicas || 1;
    const rateLimitRegulation = regulations.find((r) => r.type === 'rate_limit');
    if (rateLimitRegulation && scaleValue > rateLimitRegulation.limitValue) {
      violations.push(
        `Scaling to ${scaleValue} exceeds rate limit (${rateLimitRegulation.limitValue})`
      );
    }
  }

  return {
    allowed: violations.length === 0,
    violations,
    metrics,
  };
}
