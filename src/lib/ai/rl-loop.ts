import { z } from 'zod';
import { db } from '@/lib/db';
import { generateSyntheticIncident } from '@/lib/synthetic/data-generator';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getRewardPrediction } from './reward-model';
import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';

/**
 * Reinforcement Learning Loop
 * Self-reflection and continuous improvement for autonomous SRE
 */

export interface ReflectionEpisode {
  episodeId: string;
  timestamp: Date;
  avgReward: number;
  improvements: string[];
  syntheticDataGenerated: number;
}

/**
 * Calculate reward based on incident resolution quality
 * Higher reward = better performance (reduced MTTD, accurate severity, etc.)
 */
function calculateReward(incident: any): number {
  try {
    const metadata = typeof incident.content === 'string'
      ? JSON.parse(incident.content)
      : incident.content;

    // High severity = bad (negative reward)
    if (metadata.severity === 'sev-0') return -1.0;
    if (metadata.severity === 'sev-1') return -0.5;
    if (metadata.severity === 'sev-2') return 0.2;
    if (metadata.severity === 'sev-3') return 0.5;

    // Bonus for resolved incidents
    if (metadata.status === 'resolved') return 0.3;

    return 0; // Neutral
  } catch (error) {
    return 0;
  }
}

/**
 * Run self-reflection episode
 * Analyzes performance and generates improvements
 */
export async function runSelfReflectionEpisode({
  modelId = 'o1-mini',
  batch = 32,
  workspaceId,
}: {
  modelId?: string;
  batch?: number;
  workspaceId?: string;
}): Promise<ReflectionEpisode> {
  const episodeId = `episode-${Date.now()}`;

  // 1. Fetch recent resolutions (last 24 hours)
  const recentResolutions = await db.incidentData.findMany({
    where: {
      resolvedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
      ...(workspaceId ? {
        thread: {
          channel: {
            workspaceId,
          },
        },
      } : {}),
    },
    include: {
      thread: {
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
    take: batch,
  });

  // 2. Calculate average reward
  const rewards = recentResolutions.map((incident) => {
    const message = incident.thread?.messages?.[0];
    return calculateReward(message || incident);
  });

  const avgReward = rewards.length > 0
    ? rewards.reduce((sum, r) => sum + r, 0) / rewards.length
    : 0;

  // 3. Generate "Reflection" prompt (Self-Correction)
  const recentExamples = recentResolutions.slice(0, 3).map((incident) => {
    const message = incident.thread?.messages?.[0];
    const content = typeof message?.content === 'string'
      ? JSON.parse(message.content)
      : message?.content || {};
    return {
      severity: incident.severity,
      status: incident.status,
      rootCause: incident.rootCause?.substring(0, 100),
      fix: incident.fix?.substring(0, 100),
    };
  });

  const reflectionPrompt = `You are an autonomous AI Site Reliability Engineer (SRE) with self-correction capabilities.

Performance Analysis (Last 24 Hours):
- Average Reward: ${avgReward.toFixed(2)} (range: -1.0 to +1.0)
- Resolutions Analyzed: ${recentResolutions.length}
- Performance: ${avgReward > 0.3 ? 'Good' : avgReward > 0 ? 'Moderate' : 'Needs Improvement'}

Recent Resolution Examples:
${recentExamples.map((ex, i) => `
Example ${i + 1}:
- Severity: ${ex.severity}
- Status: ${ex.status}
- Root Cause: ${ex.rootCause || 'Not provided'}
- Fix: ${ex.fix || 'Not provided'}
`).join('\n')}

Self-Correction Task:
${avgReward < 0
  ? 'Your performance is below optimal. You are missing severity trends or suggesting incorrect root causes. Identify 3 specific improvements to your incident analysis pipeline.'
  : avgReward < 0.3
  ? 'Your performance is moderate. Identify 3 improvements to enhance accuracy and reduce false positives.'
  : 'Your performance is good. Reflect on patterns and suggest 3 refinements to maintain excellence and handle edge cases better.'
}

Provide your improvements in JSON format:
{
  "improvements": [
    "Improvement 1: ...",
    "Improvement 2: ...",
    "Improvement 3: ..."
  ],
  "reasoning": "Why these improvements will help"
}`;

  // 4. Call O1-mini for self-reflection
  let improvements: string[] = [];
  let reasoning = '';

  try {
    const response = await generateText({
      model: openai(modelId),
      prompt: reflectionPrompt,
      temperature: 0.2,
      maxTokens: 500,
    });

    // Parse JSON response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      improvements = parsed.improvements || [];
      reasoning = parsed.reasoning || '';
    } else {
      // Fallback: extract improvements from text
      improvements = response.text
        .split('\n')
        .filter((line) => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
        .slice(0, 3)
        .map((line) => line.replace(/^[-•\d.]+\s*/, '').trim());
    }
  } catch (error: any) {
    console.error('Self-reflection error:', error);
    improvements = [
      'Error in self-reflection - using default improvements',
      'Review recent incident patterns manually',
      'Check model performance metrics',
    ];
  }

  // 5. Predict Rewards for proposed actions using RMAF (Reward Modeling)
  const rlData: any[] = [];
  
  for (const resolution of recentResolutions.slice(0, 10)) { // Process top 10 for efficiency
    const message = resolution.thread?.messages?.[0];
    const content = typeof message?.content === 'string'
      ? JSON.parse(message.content)
      : message?.content || {};

    const state = {
      incident: content.title || resolution.thread?.title || 'Unknown',
      severity: resolution.severity,
      status: resolution.status,
      actions_taken: content.actions || [],
      rootCause: resolution.rootCause,
      fix: resolution.fix,
    };

    // Get predicted reward BEFORE acting (if we have action data)
    if (state.actions_taken.length > 0) {
      try {
        const rewardResult = await getRewardPrediction({
          input: {
            state,
            proposedAction: {
              type: state.actions_taken[0]?.type || 'UNKNOWN',
              params: state.actions_taken[0]?.params || {},
            },
          },
        });

        // Use this reward for PPO update (simulated here)
        rlData.push({
          messages: [
            {
              role: 'system',
              content: `Predicted Reward for action: ${rewardResult.reward.toFixed(2)}. ${rewardResult.reasoning || ''}`,
            },
            {
              role: 'user',
              content: JSON.stringify(state.actions_taken[0]),
            },
            {
              role: 'assistant',
              content: 'Action Taken.',
            },
          ],
          reward_value: rewardResult.reward, // This is the advantage for PPO
          factors: rewardResult.factors,
        });
      } catch (error) {
        console.error('Reward prediction failed for resolution:', error);
      }
    }
  }

  // 6. Create JSONL with Reward Labels (PPO uses `reward_value` to compute advantage)
  if (rlData.length > 0) {
    try {
      const tmpDir = path.join(process.cwd(), 'tmp');
      await mkdir(tmpDir, { recursive: true });

      const filename = `rl-data-${Date.now()}.jsonl`;
      const filepath = path.join(tmpDir, filename);

      // Write JSONL file (one JSON object per line)
      const jsonlContent = rlData.map((item) => JSON.stringify(item)).join('\n');
      fs.writeFileSync(filepath, jsonlContent, 'utf-8');

      console.log(`[RL Loop] Saved ${rlData.length} RL training examples to ${filepath}`);
    } catch (error) {
      console.error('[RL Loop] Failed to save RL data:', error);
    }
  }

  // 7. Generate synthetic data for next training iteration (Continuous Learning)
  const syntheticIncidents = generateSyntheticIncident(10); // Generate 10 edge cases
  console.log(`[RL Loop] Generated ${syntheticIncidents.length} synthetic incidents for next training iteration.`);

  // 8. Log the reflection episode
  const episode: ReflectionEpisode = {
    episodeId,
    timestamp: new Date(),
    avgReward,
    improvements,
    syntheticDataGenerated: syntheticIncidents.length,
  };

  // Store episode in audit log for tracking
  await db.auditLog.create({
    data: {
      tableName: 'ReflectionEpisode',
      action: 'SELF_REFLECTION',
      recordId: episodeId,
      userId: 'SYSTEM',
      metadata: JSON.stringify(episode),
      timestamp: new Date(),
    },
  });

  console.log('[RL Loop] Self-reflection episode completed:', {
    episodeId,
    avgReward: avgReward.toFixed(2),
    improvements: improvements.length,
  });

  return episode;
}

/**
 * Get performance metrics for RL loop
 */
export async function getPerformanceMetrics({
  workspaceId,
  days = 7,
}: {
  workspaceId?: string;
  days?: number;
}): Promise<{
  avgReward: number;
  totalResolutions: number;
  avgResolutionTime: number; // minutes
  severityDistribution: Record<string, number>;
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const resolutions = await db.incidentData.findMany({
    where: {
      resolvedAt: {
        gte: since,
      },
      ...(workspaceId ? {
        thread: {
          channel: {
            workspaceId,
          },
        },
      } : {}),
    },
    include: {
      thread: {
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  const rewards = resolutions.map((incident) => {
    const message = incident.thread?.messages?.[0];
    return calculateReward(message || incident);
  });

  const avgReward = rewards.length > 0
    ? rewards.reduce((sum, r) => sum + r, 0) / rewards.length
    : 0;

  // Calculate average resolution time
  const resolutionTimes = resolutions
    .filter((r) => r.resolvedAt && r.createdAt)
    .map((r) => {
      const created = new Date(r.createdAt).getTime();
      const resolved = new Date(r.resolvedAt!).getTime();
      return (resolved - created) / (1000 * 60); // minutes
    });

  const avgResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
    : 0;

  // Severity distribution
  const severityDistribution: Record<string, number> = {};
  resolutions.forEach((r) => {
    severityDistribution[r.severity] = (severityDistribution[r.severity] || 0) + 1;
  });

  return {
    avgReward,
    totalResolutions: resolutions.length,
    avgResolutionTime,
    severityDistribution,
  };
}
