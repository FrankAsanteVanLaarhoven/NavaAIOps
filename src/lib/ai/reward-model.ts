import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

export const RewardModelInput = z.object({
  state: z.any(), // Current system state (metrics, logs)
  proposedAction: z.object({
    type: z.string(),
    params: z.any(),
  }),
});

export type RewardModelInput = z.infer<typeof RewardModelInput>;

const RewardModelOutput = z.object({
  reward: z.number().min(-10).max(10),
  reasoning: z.string().optional(),
  factors: z.object({
    latencyImpact: z.number().optional(),
    complianceRisk: z.number().optional(),
    resourceEfficiency: z.number().optional(),
    userSentiment: z.number().optional(),
  }).optional(),
});

/**
 * Reward Modeling Agent (RMAF) for Site Reliability Engineering
 * Predicts the expected reward for a proposed action before execution
 */
export async function getRewardPrediction({ input }: { input: RewardModelInput }) {
  const modelId = process.env.REWARD_MODEL_ID || 'gpt-4o-mini';
  const model = openai(modelId);

  const prompt = `
You are a Reward Modeling Agent (RMAF) for Site Reliability Engineering.
Given the following system state and a proposed action, predict the expected reward (-10.0 to +10.0).

System State:
${JSON.stringify(input.state, null, 2)}

Proposed Action:
${JSON.stringify(input.proposedAction, null, 2)}

Consider:
1. Latency Impact: How will this action affect system latency? (negative = bad, positive = good)
2. Compliance Risk: Does this action violate any policies? (negative = violation, positive = compliant)
3. Resource Efficiency: Is this action resource-efficient? (positive = efficient, negative = wasteful)
4. User Sentiment: How will users be affected? (positive = improved experience, negative = degraded)

Output a JSON object with:
- reward: A number between -10.0 and +10.0
- reasoning: Brief explanation of the reward prediction
- factors: Breakdown of each factor's contribution
`;

  try {
    const result = await generateObject({
      model,
      schema: RewardModelOutput,
      prompt,
      temperature: 0.1,
    });

    return {
      reward: result.object.reward,
      reasoning: result.object.reasoning,
      factors: result.object.factors,
    };
  } catch (error: any) {
    console.error('Reward model prediction failed:', error);
    // Fallback: Return neutral reward
    return {
      reward: 0.0,
      reasoning: 'Reward model prediction failed, using neutral reward',
      factors: {
        latencyImpact: 0,
        complianceRisk: 0,
        resourceEfficiency: 0,
        userSentiment: 0,
      },
    };
  }
}
