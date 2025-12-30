import { db } from './db';
import ZAI from 'z-ai-web-dev-sdk';

export interface CodeContext {
  repository: string;
  filePath: string;
  content: string;
  language?: string;
  similarity?: number;
}

// Index code file for RAG
export async function indexCodeFile(
  repository: string,
  filePath: string,
  content: string,
  language?: string
) {
  try {
    // Generate embedding for code
    const embedding = await generateCodeEmbedding(content);
    
    // Store in database
    await db.codeIndex.upsert({
      where: {
        id: `${repository}:${filePath}`, // Simple ID, in production use proper unique constraint
      },
      create: {
        repository,
        filePath,
        content,
        language,
        embedding: JSON.stringify(embedding),
      },
      update: {
        content,
        embedding: JSON.stringify(embedding),
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to index code:', error);
    throw error;
  }
}

// Generate embedding for code
async function generateCodeEmbedding(code: string): Promise<number[]> {
  try {
    const zai = await ZAI.create();
    
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'Generate a semantic representation of this code as a JSON array of 10 numbers between 0 and 1.',
        },
        {
          role: 'user',
          content: `Code:\n\`\`\`\n${code.slice(0, 2000)}\n\`\`\`\n\nReturn only a JSON array of 10 numbers.`,
        },
      ],
      stream: false,
      thinking: { type: 'disabled' },
    });

    const content = response.choices?.[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length === 10) {
        return parsed.map((n: any) => (typeof n === 'number' ? n : 0.5));
      }
    } catch {
      // Fallback
    }
  } catch (error) {
    console.error('Failed to generate code embedding:', error);
  }

  // Fallback: hash-based vector
  const hash = code.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const vector: number[] = [];
  for (let i = 0; i < 10; i++) {
    vector.push(Math.abs(Math.sin(hash + i)) % 1);
  }
  return vector;
}

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search code using RAG
export async function searchCode(
  query: string,
  repository?: string,
  limit: number = 5
): Promise<CodeContext[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateCodeEmbedding(query);
    
    // Get all code files (or filter by repository)
    const codeFiles = await db.codeIndex.findMany({
      where: repository ? { repository } : undefined,
    });

    // Calculate similarities
    const results = codeFiles
      .map((file) => {
        if (!file.embedding) return null;
        try {
          const embedding = JSON.parse(file.embedding) as number[];
          const similarity = cosineSimilarity(queryEmbedding, embedding);
          return {
            repository: file.repository,
            filePath: file.filePath,
            content: file.content,
            language: file.language || undefined,
            similarity,
          };
        } catch {
          return null;
        }
      })
      .filter((r): r is CodeContext => r !== null && r.similarity !== undefined)
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);

    return results;
  } catch (error: any) {
    console.error('Failed to search code:', error);
    return [];
  }
}

// RAG-powered AI assistant that can reference code
export async function* ragAssistant(
  query: string,
  repository?: string,
  context?: { channelId?: string; threadId?: string }
) {
  try {
    // Search relevant code
    const codeContexts = await searchCode(query, repository, 3);
    
    // Build context prompt
    let contextPrompt = 'You are a helpful AI assistant that can read and understand code.';
    
    if (codeContexts.length > 0) {
      contextPrompt += '\n\nRelevant code from the codebase:\n';
      codeContexts.forEach((ctx, idx) => {
        contextPrompt += `\n[File ${idx + 1}: ${ctx.filePath}]\n\`\`\`${ctx.language || ''}\n${ctx.content.slice(0, 500)}\n\`\`\`\n`;
      });
    }

    // Get channel context if available
    if (context?.channelId) {
      const { getChannelContext, generateContextAwarePrompt } = await import('./ai-context');
      const channelContext = await getChannelContext(context.channelId);
      if (channelContext) {
        contextPrompt += '\n\n' + generateContextAwarePrompt(channelContext, 'compose');
      }
    }

    // Call AI with code context
    const zai = await ZAI.create();
    
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: contextPrompt,
        },
        {
          role: 'user',
          content: query,
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
    yield `Error: ${error.message || 'Failed to get AI response'}`;
  }
}
