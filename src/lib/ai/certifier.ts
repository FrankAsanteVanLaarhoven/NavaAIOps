import { db } from '@/lib/db';
import { createHash } from 'crypto';

/**
 * Certificate Generator
 * Creates tamper-evident compliance certificates
 */

export interface CertificateInput {
  incidentId: string;
  workspaceId: string;
}

export interface ComplianceCertificate {
  id: string;
  incident_id: string;
  incident_title: string;
  workspace_id: string;
  timestamp: Date;
  status: 'passed' | 'failed' | 'warning';
  overall_score: number;
  policies_reviewed: Array<{ id: string; name: string; category: string }>;
  violations: string[];
  evidence_signature: string;
  certified_by: string;
  verification_chain: any[];
}

/**
 * Generate compliance certificate
 */
export async function generateCertificate({
  incidentId,
  workspaceId,
}: CertificateInput): Promise<ComplianceCertificate> {
  // Fetch the Compliance Log
  const log = await db.complianceLog.findFirst({
    where: {
      incidentId,
      ...(workspaceId ? { policy: { workspaceId } } : {}),
    },
    include: {
      policy: true,
      regulation: true,
      incident: {
        include: {
          channel: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  if (!log) {
    throw new Error('No compliance log found for this incident. Run verification first.');
  }

  // Fetch all policies for this workspace
  const policies = await db.policy.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
  });

  // Parse evidence
  const evidence = typeof log.evidence === 'string'
    ? JSON.parse(log.evidence)
    : log.evidence || {};

  // Generate certificate ID (hash of incident + timestamp)
  const certificateId = createHash('sha256')
    .update(`${incidentId}:${log.timestamp.getTime()}`)
    .digest('hex')
    .substring(0, 16);

  // Get incident title
  const incidentTitle = log.incident?.title || 'Untitled Incident';

  const certificate: ComplianceCertificate = {
    id: certificateId,
    incident_id: incidentId,
    incident_title: incidentTitle,
    workspace_id: workspaceId,
    timestamp: log.timestamp,
    status: log.status as 'passed' | 'failed' | 'warning',
    overall_score: log.score,
    policies_reviewed: policies.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
    })),
    violations: evidence.violations?.blocked || [],
    evidence_signature: log.signature,
    certified_by: log.certifiedBy,
    verification_chain: evidence.proposedActions || [],
  };

  return certificate;
}
