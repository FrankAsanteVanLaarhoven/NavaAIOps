import ZAI from 'z-ai-web-dev-sdk';
import { db } from './db';
import StarterKit from '@tiptap/starter-kit';

// Convert TipTap JSON to Markdown
export function tiptapToMarkdown(json: any): string {
  // Simple conversion - in production, use a proper TipTap markdown serializer
  if (typeof json === 'string') {
    try {
      json = JSON.parse(json);
    } catch {
      return json;
    }
  }
  
  if (!json || !json.content) return '';
  
  let markdown = '';
  
  function traverse(node: any): void {
    if (!node) return;
    
    if (node.type === 'paragraph') {
      if (node.content) {
        node.content.forEach((child: any) => traverse(child));
        markdown += '\n';
      } else {
        markdown += '\n';
      }
    } else if (node.type === 'text') {
      markdown += node.text || '';
    } else if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level) + ' ';
      if (node.content) {
        node.content.forEach((child: any) => traverse(child));
      }
      markdown = markdown.trimEnd() + '\n' + prefix;
      if (node.content) {
        const headingText = markdown.split('\n').pop() || '';
        markdown = markdown.slice(0, -headingText.length);
        node.content.forEach((child: any) => {
          if (child.type === 'text') {
            markdown += child.text || '';
          }
        });
        markdown += '\n';
      }
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      if (node.content) {
        node.content.forEach((child: any, index: number) => {
          const prefix = node.type === 'orderedList' ? `${index + 1}. ` : '- ';
          markdown += prefix;
          traverse(child);
          markdown += '\n';
        });
      }
    } else if (node.type === 'listItem') {
      if (node.content) {
        node.content.forEach((child: any) => traverse(child));
      }
    } else if (node.type === 'bold') {
      markdown += '**';
      if (node.content) {
        node.content.forEach((child: any) => traverse(child));
      }
      markdown += '**';
    } else if (node.type === 'italic') {
      markdown += '*';
      if (node.content) {
        node.content.forEach((child: any) => traverse(child));
      }
      markdown += '*';
    } else if (node.content) {
      node.content.forEach((child: any) => traverse(child));
    }
  }
  
  if (json.content) {
    json.content.forEach((node: any) => traverse(node));
  }
  
  return markdown.trim();
}

// Note: markdownToJson is now in a client-side utility file

// Get thread messages for summarization
export async function getThreadMessages(threadId: string) {
  const messages = await db.message.findMany({
    where: { threadId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });
  
  return messages;
}

// Summarize thread using Zhip-AI with context awareness
export async function* summarizeThread(threadId: string, channelId?: string) {
  const messages = await getThreadMessages(threadId);
  
  if (messages.length === 0) {
    yield 'No messages in this thread.';
    return;
  }
  
  // Get channel context if channelId provided
  let contextPrompt = 'You are a helpful assistant that summarizes conversations clearly and concisely.';
  if (channelId) {
    const { getChannelContext, generateContextAwarePrompt } = await import('./ai-context');
    const context = await getChannelContext(channelId);
    if (context) {
      contextPrompt = generateContextAwarePrompt(context, 'summarize');
    }
  }
  
  // Convert all messages to markdown
  const conversationText = messages
    .map((msg) => {
      const content = typeof msg.content === 'string' 
        ? JSON.parse(msg.content) 
        : msg.content;
      const markdown = tiptapToMarkdown(content);
      return `${msg.user.name || msg.user.email}: ${markdown}`;
    })
    .join('\n\n');
  
  try {
    const zai = await ZAI.create();
    
    const prompt = `Summarize the following conversation thread in a clear and concise way. Provide a brief overview followed by 3-5 key points.\n\nConversation:\n${conversationText}`;
    
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: contextPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
      thinking: { type: 'disabled' },
    });
    
    for await (const chunk of response) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error: any) {
    yield `Error: ${error.message || 'Failed to generate summary'}`;
  }
}

// Improve compose text using Zhip-AI with context awareness
export async function* improveCompose(draftText: string, channelId?: string) {
  try {
    // Get channel context if channelId provided
    let contextPrompt = 'You are a writing assistant that improves text while maintaining the original meaning and intent.';
    if (channelId) {
      const { getChannelContext, generateContextAwarePrompt } = await import('./ai-context');
      const context = await getChannelContext(channelId);
      if (context) {
        contextPrompt = generateContextAwarePrompt(context, 'compose');
      }
    }
    
    const zai = await ZAI.create();
    
    const prompt = `Rewrite the following text to be more professional, clear, and grammatically correct. Keep the same meaning and tone, but improve the writing quality:\n\n${draftText}`;
    
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: contextPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
      thinking: { type: 'disabled' },
    });
    
    for await (const chunk of response) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error: any) {
    yield `Error: ${error.message || 'Failed to improve text'}`;
  }
}
