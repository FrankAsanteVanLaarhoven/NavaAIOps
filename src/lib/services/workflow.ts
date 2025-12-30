import { db } from '../db';
import { z } from 'zod';
import { logChange } from './audit';

export const WorkflowTriggerSchema = z.object({
  name: z.string(),
  triggerType: z.enum(['KEYWORD', 'CHANNEL_TYPE', 'USER_ROLE', 'MESSAGE']),
  triggerValue: z.string(),
  channelId: z.string().optional(),
  threadId: z.string().optional(),
  actions: z.array(
    z.object({
      type: z.enum(['CREATE_INCIDENT', 'PING_CHANNEL', 'ADD_REACTION', 'SEND_MESSAGE', 'CREATE_THREAD']),
      target: z.string(),
      config: z.any().optional(),
    })
  ),
  enabled: z.boolean().default(true),
});

export type WorkflowTriggerInput = z.infer<typeof WorkflowTriggerSchema>;

/**
 * Create a new workflow trigger
 */
export async function createWorkflow(input: WorkflowTriggerInput, userId: string) {
  const workflow = await db.workflowTrigger.create({
    data: {
      name: input.name,
      triggerType: input.triggerType,
      triggerValue: input.triggerValue,
      channelId: input.channelId || undefined,
      threadId: input.threadId || undefined,
      actions: JSON.stringify(input.actions),
      enabled: input.enabled,
    },
  });

  // Log workflow creation
  await logChange({
    tableName: 'WorkflowTrigger',
    action: 'CREATE',
    recordId: workflow.id,
    userId,
    metadata: { name: input.name, triggerType: input.triggerType },
  });

  return workflow;
}

/**
 * Check if a message matches a workflow trigger
 */
function matchesTrigger(
  workflow: { triggerType: string; triggerValue: string },
  context: {
    messageText: string;
    channelType?: string;
    userId?: string;
    userRole?: string;
  }
): boolean {
  switch (workflow.triggerType) {
    case 'KEYWORD':
      return context.messageText.toLowerCase().includes(workflow.triggerValue.toLowerCase());
    case 'CHANNEL_TYPE':
      return context.channelType === workflow.triggerValue;
    case 'USER_ROLE':
      return context.userRole === workflow.triggerValue;
    case 'MESSAGE':
      return true; // All messages match
    default:
      return false;
  }
}

/**
 * Execute workflow actions
 */
async function executeAction(
  action: { type: string; target: string; config?: any },
  context: {
    threadId: string;
    channelId: string;
    userId: string;
    messageId?: string;
  }
) {
  switch (action.type) {
    case 'CREATE_INCIDENT': {
      // Create incident thread in target channel
      const thread = await db.thread.create({
        data: {
          channelId: action.target,
          title: action.config?.title || 'Automated Incident',
        },
      });

      await db.incidentData.create({
        data: {
          threadId: thread.id,
          status: 'investigating',
          severity: action.config?.severity || 'sev-2',
          impact: action.config?.impact || 'Automated workflow trigger',
        },
      });

      return { type: 'incident_created', threadId: thread.id };
    }

    case 'PING_CHANNEL': {
      // Create a system message in target channel
      const channel = await db.channel.findUnique({
        where: { id: action.target },
        include: { threads: { take: 1 } },
      });

      if (channel && channel.threads.length > 0) {
        await db.message.create({
          data: {
            threadId: channel.threads[0].id,
            userId: context.userId,
            content: JSON.stringify({
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: action.config?.message || 'Automated notification' }],
                },
              ],
            }),
            type: 'text',
          },
        });
      }

      return { type: 'channel_pinged' };
    }

    case 'SEND_MESSAGE': {
      await db.message.create({
        data: {
          threadId: context.threadId,
          userId: context.userId,
          content: JSON.stringify({
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: action.config?.message || 'Automated message' }],
              },
            ],
          }),
          type: 'text',
        },
      });

      return { type: 'message_sent' };
    }

    case 'CREATE_THREAD': {
      const thread = await db.thread.create({
        data: {
          channelId: action.target,
          title: action.config?.title || 'Automated Thread',
        },
      });

      return { type: 'thread_created', threadId: thread.id };
    }

    case 'ADD_REACTION': {
      if (context.messageId) {
        await db.reaction.create({
          data: {
            messageId: context.messageId,
            userId: context.userId,
            emoji: action.config?.emoji || '✅',
          },
        });
      }

      return { type: 'reaction_added' };
    }

    default:
      return { type: 'unknown_action' };
  }
}

/**
 * Trigger workflows for a message
 */
export async function triggerWorkflows(context: {
  messageId: string;
  threadId: string;
  channelId: string;
  userId: string;
  messageText: string;
  channelType?: string;
}) {
  // Get all enabled workflows for this channel/thread
  const workflows = await db.workflowTrigger.findMany({
    where: {
      enabled: true,
      OR: [
        { channelId: context.channelId },
        { threadId: context.threadId },
      ],
    },
  });

  const results = [];

  for (const workflow of workflows) {
    const triggerConfig = {
      triggerType: workflow.triggerType,
      triggerValue: workflow.triggerValue,
    };

    if (matchesTrigger(triggerConfig, {
      messageText: context.messageText,
      channelType: context.channelType,
    })) {
      const actions = JSON.parse(workflow.actions) as Array<{ type: string; target: string; config?: any }>;
      
      for (const action of actions) {
        try {
          const result = await executeAction(action, {
            threadId: context.threadId,
            channelId: context.channelId,
            userId: context.userId,
            messageId: context.messageId,
          });
          results.push({ workflowId: workflow.id, action, result });
        } catch (error) {
          console.error(`Failed to execute workflow action:`, error);
          results.push({ workflowId: workflow.id, action, error: String(error) });
        }
      }
    }
  }

  return results;
}
