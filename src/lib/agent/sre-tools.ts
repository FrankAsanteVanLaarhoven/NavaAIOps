import { db } from '@/lib/db';

/**
 * SRE Agent Tools
 * Functions for detecting anomalies, proposing fixes, executing remediations, and verifying results
 */

export interface Anomaly {
  id: string;
  type: 'PERFORMANCE' | 'ERROR' | 'AVAILABILITY' | 'SECURITY';
  metric: string;
  value: number;
  threshold: number;
  severityScore: number; // 0-10
  description: string;
  timestamp: Date;
}

/**
 * Detect anomalies from metrics/audit logs
 * In production, this would query Prometheus, CloudWatch, or your metrics DB
 */
export async function detectAnomalies(workspaceId: string): Promise<Anomaly[]> {
  // Query recent audit logs for error patterns
  const recentErrors = await db.auditLog.findMany({
    where: {
      action: 'DELETE',
      timestamp: {
        gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      },
    },
    take: 100,
    orderBy: { timestamp: 'desc' },
  });

  // Query incident data for active incidents
  const activeIncidents = await db.incidentData.findMany({
    where: {
      status: {
        in: ['investigating', 'identified'],
      },
      thread: {
        channel: {
          type: 'incident',
        },
      },
    },
    include: {
      thread: {
        include: {
          messages: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  const anomalies: Anomaly[] = [];

  // Check for high error rate
  if (recentErrors.length > 10) {
    anomalies.push({
      id: `anom-error-rate-${Date.now()}`,
      type: 'ERROR',
      metric: 'error_rate',
      value: recentErrors.length,
      threshold: 10,
      severityScore: Math.min(9.0, recentErrors.length / 5),
      description: `High error rate detected: ${recentErrors.length} errors in last 15 minutes`,
      timestamp: new Date(),
    });
  }

  // Check for active critical incidents
  const criticalIncidents = activeIncidents.filter(
    (inc) => inc.severity === 'sev-0' || inc.severity === 'sev-1'
  );

  if (criticalIncidents.length > 0) {
    criticalIncidents.forEach((incident) => {
      anomalies.push({
        id: `anom-incident-${incident.id}`,
        type: 'AVAILABILITY',
        metric: 'incident_severity',
        value: incident.severity === 'sev-0' ? 10 : 8,
        threshold: 7,
        severityScore: incident.severity === 'sev-0' ? 9.5 : 8.0,
        description: `Active ${incident.severity.toUpperCase()} incident: ${incident.thread?.title || 'Untitled'}`,
        timestamp: incident.createdAt,
      });
    });
  }

  // Mock: Database latency spike (in production, query actual metrics)
  // For demo purposes, we'll add a mock anomaly if no real ones exist
  if (anomalies.length === 0) {
    anomalies.push({
      id: `anom-db-latency-${Date.now()}`,
      type: 'PERFORMANCE',
      metric: 'database_query_latency_p99',
      value: 2450, // ms
      threshold: 100, // ms
      severityScore: 8.5,
      description: 'Database query latency spike (P99) detected: 2450ms (threshold: 100ms)',
      timestamp: new Date(),
    });
  }

  return anomalies;
}

/**
 * Propose remediation plan using LLM or rule-based selection
 */
export async function proposeRemediation(
  anomalies: Anomaly[],
  workspaceId?: string
): Promise<{
  scriptId: string;
  scriptName: string;
  command: string;
  risk: string;
  estimatedDuration: string;
  reasoning: string;
}> {
  // Get available remediation scripts
  const scripts = await db.remediationScript.findMany({
    where: {
      enabled: true,
      ...(workspaceId ? { workspaceId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  if (scripts.length === 0) {
    throw new Error('No remediation scripts available');
  }

  // Find the most critical anomaly
  const critical = anomalies.reduce((prev, curr) =>
    curr.severityScore > prev.severityScore ? curr : prev
  );

  // Rule-based script selection (in production, use LLM to select best script)
  let selectedScript = scripts[0];

  if (critical.type === 'PERFORMANCE' && critical.metric.includes('database')) {
    // Database issue -> try to find a database-related script
    selectedScript =
      scripts.find((s) => s.name.toLowerCase().includes('database')) ||
      scripts.find((s) => s.name.toLowerCase().includes('restart')) ||
      scripts[0];
  } else if (critical.type === 'ERROR' || critical.type === 'AVAILABILITY') {
    // Error/availability issue -> try rollback or restart
    selectedScript =
      scripts.find((s) => s.name.toLowerCase().includes('rollback')) ||
      scripts.find((s) => s.name.toLowerCase().includes('restart')) ||
      scripts[0];
  }

  return {
    scriptId: selectedScript.id,
    scriptName: selectedScript.name,
    command: selectedScript.command,
    risk: selectedScript.risk || 'MEDIUM',
    estimatedDuration: selectedScript.estimatedDuration || '5m',
    reasoning: `Selected ${selectedScript.name} based on anomaly type: ${critical.type}, severity: ${critical.severityScore.toFixed(1)}/10`,
  };
}

/**
 * Execute remediation script (with safeguards)
 */
export async function executeRemediation(
  scriptId: string,
  userId?: string
): Promise<{
  id: string;
  success: boolean;
  log: string;
  timestamp: Date;
  exitCode: number;
}> {
  const script = await db.remediationScript.findUnique({
    where: { id: scriptId },
  });

  if (!script) {
    throw new Error(`Remediation script not found: ${scriptId}`);
  }

  if (!script.enabled) {
    throw new Error(`Remediation script is disabled: ${script.name}`);
  }

  // ⚠️ SAFEGUARD: Sanitize command
  // In production, use a whitelist of allowed commands/scripts
  const allowedPrefixes = ['kubectl', 'systemctl', 'docker', 'npm', 'bun'];
  const commandLower = script.command.toLowerCase().trim();
  const isAllowed = allowedPrefixes.some((prefix) => commandLower.startsWith(prefix));

  if (!isAllowed && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Command not allowed in production: ${script.command.substring(0, 50)}...`
    );
  }

  // Log execution attempt
  console.log(`[SRE Agent] Executing remediation: ${script.name}`);
  console.log(`[SRE Agent] Command: ${script.command}`);

  // In production, you would:
  // 1. Execute the command via child_process or Kubernetes API
  // 2. Stream output in real-time
  // 3. Capture exit code and logs
  // For now, we simulate execution

  const simulatedSuccess = Math.random() > 0.2; // 80% success rate for demo

  const log = `[INFO] Executing remediation script: ${script.name}
[INFO] Type: ${script.type}
[INFO] Command: ${script.command}
[INFO] Risk Level: ${script.risk || 'UNKNOWN'}
[INFO] Started at: ${new Date().toISOString()}
${simulatedSuccess ? '[SUCCESS] Remediation completed successfully' : '[ERROR] Remediation failed with exit code 1'}
[INFO] Completed at: ${new Date().toISOString()}`;

  return {
    id: `exec-${Date.now()}`,
    success: simulatedSuccess,
    log,
    timestamp: new Date(),
    exitCode: simulatedSuccess ? 0 : 1,
  };
}

/**
 * Verify remediation by re-checking metrics
 */
export async function verifyRemediation(
  anomalyIds: string[],
  executionId: string
): Promise<{
  verified: boolean;
  newMetricValue?: number;
  improvement: number; // percentage improvement
  message: string;
}> {
  // In production, re-query the metrics that triggered the anomaly
  // For now, simulate verification

  // Simulate 80% chance of successful remediation
  const verified = Math.random() > 0.2;

  if (verified) {
    return {
      verified: true,
      newMetricValue: 95, // Improved from 2450ms to 95ms
      improvement: 96.1, // 96.1% improvement
      message: 'Remediation verified: Metrics have returned to normal levels. System is stable.',
    };
  } else {
    return {
      verified: false,
      newMetricValue: 2800, // Worse than before
      improvement: -14.3, // 14.3% degradation
      message: 'Remediation verification failed: Metrics have not improved. Manual intervention may be required.',
    };
  }
}

/**
 * Close incident after successful remediation
 */
export async function closeIncident(
  incidentId: string,
  userId?: string
): Promise<{ id: string; closed: boolean; message: string }> {
  const incident = await db.incidentData.findUnique({
    where: { threadId: incidentId },
  });

  if (!incident) {
    throw new Error(`Incident not found: ${incidentId}`);
  }

  // Update incident status
  await db.incidentData.update({
    where: { threadId: incidentId },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
    },
  });

  // Create incident update log
  await db.incidentUpdate.create({
    data: {
      incidentId,
      phase: 'CLOSED',
      status: 'SUCCESS',
      actor: userId || 'AI_AGENT',
      content: JSON.stringify({
        message: 'Incident resolved automatically by AI SRE Agent',
        resolvedAt: new Date().toISOString(),
      }),
      timestamp: new Date(),
    },
  });

  return {
    id: incidentId,
    closed: true,
    message: `Incident ${incidentId} closed successfully`,
  };
}
