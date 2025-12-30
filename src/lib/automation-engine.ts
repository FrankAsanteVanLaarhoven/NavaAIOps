import { db } from './db';
import { getIO } from './websocket-server';

export interface AutomationTrigger {
  type: 'message' | 'keyword' | 'webhook' | 'schedule' | 'incident';
  config: any;
}

export interface AutomationAction {
  type: 'send_message' | 'create_thread' | 'create_incident' | 'webhook' | 'github_issue';
  config: any;
}

// Process automation triggers
export async function processAutomationTrigger(
  triggerType: string,
  context: any
) {
  try {
    // Find matching automations
    const automations = await db.automation.findMany({
      where: {
        enabled: true,
        ...(context.channelId && { channelId: context.channelId }),
        ...(context.threadId && { threadId: context.threadId }),
      },
    });

    for (const automation of automations) {
      try {
        const trigger = JSON.parse(automation.trigger) as AutomationTrigger;
        
        // Check if trigger matches
        if (trigger.type === triggerType && matchesTrigger(trigger, context)) {
          // Execute actions
          const actions = JSON.parse(automation.actions) as AutomationAction[];
          for (const action of actions) {
            await executeAction(action, context);
          }
        }
      } catch (error) {
        console.error(`Failed to process automation ${automation.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to process automation trigger:', error);
  }
}

// Check if trigger matches context
function matchesTrigger(trigger: AutomationTrigger, context: any): boolean {
  switch (trigger.type) {
    case 'message':
      return true; // All messages match
    case 'keyword':
      const keywords = trigger.config.keywords || [];
      const messageText = context.messageText || '';
      return keywords.some((keyword: string) =>
        messageText.toLowerCase().includes(keyword.toLowerCase())
      );
    case 'webhook':
      return trigger.config.path === context.webhookPath;
    case 'schedule':
      // Check if current time matches schedule
      return true; // Simplified
    case 'incident':
      return context.incidentStatus === trigger.config.status;
    default:
      return false;
  }
}

// Execute automation action
async function executeAction(action: AutomationAction, context: any) {
  switch (action.type) {
    case 'send_message':
      // Create message in thread
      if (context.threadId) {
        await db.message.create({
          data: {
            threadId: context.threadId,
            userId: action.config.userId || 'system',
            content: JSON.stringify({
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: action.config.message }],
                },
              ],
            }),
            type: 'text',
          },
        });

        // Broadcast via WebSocket
        const io = getIO();
        io.to(`thread:${context.threadId}`).emit('message-received', {
          threadId: context.threadId,
          message: { content: action.config.message },
        });
      }
      break;

    case 'create_thread':
      if (context.channelId) {
        const thread = await db.thread.create({
          data: {
            channelId: context.channelId,
            title: action.config.title,
          },
        });
        // Notify via WebSocket
        const io = getIO();
        io.to(`channel:${context.channelId}`).emit('thread-created', { thread });
      }
      break;

    case 'create_incident':
      if (context.channelId) {
        const thread = await db.thread.create({
          data: {
            channelId: context.channelId,
            title: action.config.title || 'Incident',
          },
        });

        await db.incidentData.create({
          data: {
            threadId: thread.id,
            status: 'investigating',
            severity: action.config.severity || 'sev-2',
            impact: action.config.impact,
          },
        });
      }
      break;

    case 'webhook':
      // Call external webhook
      if (action.config.url) {
        await fetch(action.config.url, {
          method: action.config.method || 'POST',
          headers: action.config.headers || {},
          body: JSON.stringify(context),
        });
      }
      break;

    case 'github_issue':
      // Create GitHub issue (requires GitHub integration)
      // This would call GitHub API
      console.log('GitHub issue creation:', action.config);
      break;

    default:
      console.warn('Unknown action type:', action.type);
  }
}
