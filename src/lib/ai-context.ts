import { db } from './db';

export interface ChannelContext {
  channelId: string;
  channelName: string;
  channelType?: 'engineering' | 'sales' | 'support' | 'general';
  recentTopics?: string[];
}

// Get channel context for AI
export async function getChannelContext(channelId: string): Promise<ChannelContext | null> {
  try {
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      include: {
        threads: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!channel) return null;

    // Infer channel type from name
    const name = channel.name.toLowerCase();
    let channelType: ChannelContext['channelType'] = 'general';
    if (name.includes('eng') || name.includes('dev') || name.includes('tech')) {
      channelType = 'engineering';
    } else if (name.includes('sales') || name.includes('revenue')) {
      channelType = 'sales';
    } else if (name.includes('support') || name.includes('help')) {
      channelType = 'support';
    }

    // Extract recent topics from thread titles
    const recentTopics = channel.threads
      .map((t) => t.title)
      .filter((t): t is string => !!t)
      .slice(0, 5);

    return {
      channelId: channel.id,
      channelName: channel.name,
      channelType,
      recentTopics,
    };
  } catch (error) {
    console.error('Failed to get channel context:', error);
    return null;
  }
}

// Generate context-aware system prompt
export function generateContextAwarePrompt(
  context: ChannelContext | null,
  task: 'summarize' | 'compose'
): string {
  if (!context) {
    return task === 'summarize'
      ? 'You are a helpful assistant that summarizes conversations clearly and concisely.'
      : 'You are a writing assistant that improves text while maintaining the original meaning and intent.';
  }

  const { channelName, channelType, recentTopics } = context;

  let basePrompt = '';
  if (task === 'summarize') {
    basePrompt = `You are a helpful assistant summarizing conversations in the "${channelName}" channel.`;
  } else {
    basePrompt = `You are a writing assistant helping users in the "${channelName}" channel.`;
  }

  // Add channel type context
  switch (channelType) {
    case 'engineering':
      basePrompt += ' This is a technical/engineering channel. Use technical terminology appropriately and be precise.';
      break;
    case 'sales':
      basePrompt += ' This is a sales channel. Be professional, persuasive, and customer-focused.';
      break;
    case 'support':
      basePrompt += ' This is a support channel. Be helpful, clear, and solution-oriented.';
      break;
    default:
      basePrompt += ' Maintain a professional and friendly tone.';
  }

  // Add recent topics context
  if (recentTopics && recentTopics.length > 0) {
    basePrompt += ` Recent topics in this channel include: ${recentTopics.join(', ')}.`;
  }

  return basePrompt;
}
