import { z } from 'zod';

/**
 * Validation Engine (Rule-Based Governance)
 * Fast, deterministic policy checking before LLM verification
 */

export const GovernancePolicies = {
  productionEnvironment: {
    noDelete: true, // Cannot delete production tables
    noDropDatabase: true, // Cannot drop databases
    noHardReset: true,
  },
  cloudResources: {
    maxScale: 10, // Max scale up factor per action
    maxSpend: 10000, // Max $10k per action
    costLimit: 50, // Cost score threshold
  },
  security: {
    requireApprovalForCritical: true, // Actions affecting 'critical' systems need manual approval
    noSecretInLogs: true, // Do not allow API keys in logs
  },
};

export type ProposedAction = {
  type: 'SCALE_K8S' | 'ROLLBACK_DB' | 'RESTART_SERVICE' | 'DELETE_LOGS' | 'PAUSE_PIPELINE';
  params: {
    target: string; // Service name or ID
    scaleTo?: number; // For SCALE_K8S
    replicas?: number; // For SCALE_K8S
    reason?: string;
  };
};

export interface ValidationResult {
  allowed: boolean;
  violations: string[];
}

/**
 * Validate proposed action against governance policies
 */
export function validateProposedAction(
  action: ProposedAction,
  rules: typeof GovernancePolicies = GovernancePolicies
): ValidationResult {
  const violations: string[] = [];

  // 1. Validate Type
  const allowedTypes = [
    'SCALE_K8S',
    'ROLLBACK_DB',
    'RESTART_SERVICE',
    'DELETE_LOGS',
    'PAUSE_PIPELINE',
  ];
  if (!allowedTypes.includes(action.type)) {
    violations.push(`Action type "${action.type}" is not allowed.`);
  }

  // 2. Validate Params
  if (action.type === 'SCALE_K8S') {
    if (!action.params.scaleTo && !action.params.replicas) {
      violations.push('SCALE_K8S requires "scaleTo" or "replicas" parameter.');
    } else {
      const scaleValue = action.params.scaleTo || action.params.replicas || 1;
      // Check Cloud Resource Policy
      if (scaleValue > rules.cloudResources.maxScale) {
        violations.push(
          `Requested scale (${scaleValue}) violates max scale policy (${rules.cloudResources.maxScale}).`
        );
      }
      if (scaleValue < 1 / rules.cloudResources.maxScale) {
        violations.push(
          `Requested scale (${scaleValue}) violates min scale policy (${1 / rules.cloudResources.maxScale}).`
        );
      }
    }
  }

  // 3. Validate Target (Production Safety)
  if (action.type === 'ROLLBACK_DB' || action.type === 'DELETE_LOGS') {
    if (action.params.target?.toLowerCase().includes('prod')) {
      if (rules.productionEnvironment.noDelete || rules.productionEnvironment.noDropDatabase) {
        violations.push(
          'Dangerous action on production target. Policy forbids modification.'
        );
      }
    }
  }

  // 4. Validate Security Policy (Secrets)
  if (action.type === 'PAUSE_PIPELINE') {
    // Check if the action params contain any secrets (simulated check)
    const paramsString = JSON.stringify(action.params);
    if (paramsString.includes('sk-') || paramsString.includes('API_KEY')) {
      if (rules.security.noSecretInLogs) {
        violations.push('Action params may contain secrets. Policy violation.');
      }
    }
  }

  // 5. Validate Cost/Spend (Simulated)
  // In a real scenario, you would query a cost estimator API
  const estimatedCost =
    action.type === 'SCALE_K8S'
      ? (action.params.scaleTo || action.params.replicas || 1) * 100
      : 0;
  if (estimatedCost > rules.cloudResources.maxSpend) {
    violations.push(
      `Estimated cost ($${estimatedCost}) exceeds limit ($${rules.cloudResources.maxSpend}).`
    );
  }

  return {
    allowed: violations.length === 0,
    violations,
  };
}
