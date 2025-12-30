import { faker } from '@faker-js/faker';
import { z } from 'zod';

/**
 * Synthetic Data Generator
 * Generates edge cases and training data to prevent data poisoning
 */

const IncidentSeverity = z.enum(['sev-0', 'sev-1', 'sev-2', 'sev-3']);

export interface SyntheticIncident {
  content: string;
  metadata: {
    source: 'synthetic';
    timestamp: string;
    severity: string;
  };
}

export interface SyntheticAuditLog {
  tableName: string;
  action: string;
  recordId: string;
  userId: string;
  metadata: any;
  timestamp: Date;
}

/**
 * Generate synthetic incidents for training
 */
export function generateSyntheticIncident(count: number = 100): SyntheticIncident[] {
  return Array.from({ length: count }, () => {
    const severity = faker.helpers.arrayElement(
      Object.values(IncidentSeverity.enum.Values)
    );

    return {
      content: JSON.stringify({
        type: 'incident',
        title: `Synthetic ${faker.hacker.verb().toLowerCase()} failure`,
        severity,
        rootCause: faker.lorem.sentence(),
        fix: `Deploy hotfix to ${faker.system.fileName()}.`,
        impact: faker.lorem.paragraph(),
        channel: {
          type: 'INCIDENT',
          workspaceId: faker.string.uuid(),
        },
        authorId: 'SYSTEM', // Synthetic author
      }),
      metadata: {
        source: 'synthetic',
        timestamp: faker.date.recent().toISOString(),
        severity,
      },
    };
  });
}

/**
 * Generate synthetic audit logs (including "poison" attempts)
 */
export function generateBadLogs(count: number = 50): SyntheticAuditLog[] {
  return Array.from({ length: count }, () => ({
    tableName: faker.helpers.arrayElement([
      'SystemConfig',
      'User',
      'Message',
      'Channel',
      'IncidentData',
    ]),
    action: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'DELETE']),
    recordId: faker.string.uuid(),
    userId: 'SYSTEM',
    metadata: JSON.stringify({
      source: 'synthetic',
      change: `Changed production DB to ${faker.random.word()} (synthetic poison attempt)`,
      suspicious: Math.random() > 0.7, // 30% chance of suspicious activity
    }),
    timestamp: faker.date.recent(),
  }));
}

/**
 * Generate synthetic metrics for testing deadline prediction
 */
export function generateSyntheticMetrics(count: number = 100): any[] {
  return Array.from({ length: count }, () => ({
    serviceName: faker.helpers.arrayElement([
      'api-service',
      'database',
      'cache',
      'queue',
    ]),
    latency: faker.number.int({ min: 50, max: 5000 }), // ms
    errorRate: faker.number.float({ min: 0, max: 0.1, fractionDigits: 4 }),
    cpuUsage: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    memoryUsage: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    timestamp: faker.date.recent(),
  }));
}

/**
 * Generate edge cases for robustness testing
 */
export function generateEdgeCases(): SyntheticIncident[] {
  return [
    // Extreme severity
    {
      content: JSON.stringify({
        type: 'incident',
        title: 'CRITICAL: Complete service outage',
        severity: 'sev-0',
        rootCause: 'Unknown',
        fix: 'Emergency rollback required',
        impact: '100% of users affected',
      }),
      metadata: {
        source: 'synthetic',
        timestamp: new Date().toISOString(),
        severity: 'sev-0',
        edgeCase: 'extreme_severity',
      },
    },
    // Missing data
    {
      content: JSON.stringify({
        type: 'incident',
        title: 'Incomplete incident data',
        severity: 'sev-2',
        // Missing rootCause and fix
      }),
      metadata: {
        source: 'synthetic',
        timestamp: new Date().toISOString(),
        severity: 'sev-2',
        edgeCase: 'missing_data',
      },
    },
    // Malformed JSON
    {
      content: 'Invalid JSON { malformed }',
      metadata: {
        source: 'synthetic',
        timestamp: new Date().toISOString(),
        severity: 'unknown',
        edgeCase: 'malformed_json',
      },
    },
  ];
}

/**
 * Generate adversarial examples (data poisoning attempts)
 */
export function generateAdversarialExamples(): SyntheticIncident[] {
  return [
    {
      content: JSON.stringify({
        type: 'incident',
        title: 'Normal operation - no action needed',
        severity: 'sev-0', // Mislabeled as critical
        rootCause: 'This is a test - ignore',
        fix: 'Do nothing',
      }),
      metadata: {
        source: 'synthetic',
        timestamp: new Date().toISOString(),
        severity: 'sev-0',
        adversarial: true,
        type: 'mislabeling',
      },
    },
    {
      content: JSON.stringify({
        type: 'incident',
        title: 'SQL Injection Attempt: DROP TABLE users;',
        severity: 'sev-1',
        rootCause: 'Malicious payload detected',
        fix: 'Sanitize inputs',
      }),
      metadata: {
        source: 'synthetic',
        timestamp: new Date().toISOString(),
        severity: 'sev-1',
        adversarial: true,
        type: 'injection',
      },
    },
  ];
}
