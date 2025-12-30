import { VercelKVService } from './services/vercel-kv';

/**
 * A/B Testing and Canary Deployment for Fine-Tuned Model
 */

export interface ModelVariant {
  id: string;
  name: string;
  modelId: string;
  weight: number; // 0-100, percentage of traffic
}

export const MODEL_VARIANTS: ModelVariant[] = [
  {
    id: 'finetuned',
    name: 'Fine-Tuned DevOps Model',
    modelId: process.env.FINETUNED_MODEL_ID || 'ft:gpt-4o-mini-navaflow-devops-v1',
    weight: parseInt(process.env.FINETUNED_MODEL_WEIGHT || '10', 10), // 10% canary by default
  },
  {
    id: 'base',
    name: 'Base Model (zhip-ai)',
    modelId: process.env.AI_MODEL || 'zhip-ai/zlm-7b-v3.5-ny-free',
    weight: 90, // 90% base model
  },
];

/**
 * Select model variant based on A/B testing
 */
export function selectModelVariant(userId: string, feature: 'incident' | 'audit' | 'code'): string {
  // Check if user is in canary group
  const canaryUsers = process.env.CANARY_USER_IDS?.split(',') || [];
  if (canaryUsers.includes(userId)) {
    return MODEL_VARIANTS[0].modelId; // Always use fine-tuned for canary users
  }

  // Weighted random selection
  const totalWeight = MODEL_VARIANTS.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of MODEL_VARIANTS) {
    random -= variant.weight;
    if (random <= 0) {
      return variant.modelId;
    }
  }

  // Fallback to base model
  return MODEL_VARIANTS[1].modelId;
}

/**
 * Track model usage for analytics
 */
export async function trackModelUsage(
  userId: string,
  variant: string,
  feature: string,
  metrics: {
    responseTime?: number;
    tokensUsed?: number;
    accuracy?: number;
  }
) {
  try {
    const key = `model-usage:${userId}:${Date.now()}`;
    await VercelKVService.set(key, {
      variant,
      feature,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to track model usage:', error);
  }
}

/**
 * Get A/B test results
 */
export async function getABTestResults(feature: string, days: number = 7) {
  // In production, query from analytics database
  // For now, return mock structure
  return {
    feature,
    period: `${days} days`,
    variants: MODEL_VARIANTS.map((v) => ({
      id: v.id,
      name: v.name,
      requests: 0,
      avgResponseTime: 0,
      avgAccuracy: 0,
      totalTokens: 0,
    })),
  };
}
