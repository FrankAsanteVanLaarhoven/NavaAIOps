import { z } from 'zod';
import { db } from '@/lib/db';
import { generateSyntheticIncident } from '@/lib/synthetic/data-generator';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

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

  // 5. Generate synthetic data for next training iteration (Continuous Learning)
  const syntheticIncidents = generateSyntheticIncident(10); // Generate 10 edge cases
  console.log(`[RL Loop] Generated ${syntheticIncidents.length} synthetic incidents for next training iteration.`);

  // 6. Log the reflection episode
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
