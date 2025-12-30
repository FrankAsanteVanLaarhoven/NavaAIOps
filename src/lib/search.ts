import { db } from './db';
import { tiptapToMarkdown } from './ai';
import ZAI from 'z-ai-web-dev-sdk';

// Simple embedding generation (using AI SDK)
// In production, use OpenAI embeddings API or dedicated embedding model
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // For now, use a simple hash-based approach
    // In production, replace with actual embedding API
    const zai = await ZAI.create();
    
    // Use AI to generate a semantic representation
    // This is a placeholder - in production use dedicated embedding model
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'Generate a semantic representation of this text as a JSON array of 10 numbers between 0 and 1.',
        },
        {
          role: 'user',
          content: `Text: "${text}"\n\nReturn only a JSON array of 10 numbers.`,
        },
      ],
      stream: false,
      thinking: { type: 'disabled' },
    });

    const content = response.choices?.[0]?.message?.content || '';
    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length === 10) {
        return parsed.map(n => typeof n === 'number' ? n : 0.5);
      }
    } catch {
      // Fallback to hash-based vector
    }
  } catch (error) {
    console.error('Failed to generate embedding:', error);
  }

  // Fallback: simple hash-based vector (not semantic, but works)
  const hash = text.split('').reduce((acc, char) => {
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

// Extract plain text from TipTap JSON for keyword search
export function extractSearchText(content: string): string {
  try {
    const json = typeof content === 'string' ? JSON.parse(content) : content;
    return tiptapToMarkdown(json);
  } catch {
    return content;
  }
}

// Index a message for search
export async function indexMessage(messageId: string) {
  const message = await db.message.findUnique({
    where: { id: messageId },
    include: { user: true },
  });

  if (!message) return;

  const searchText = extractSearchText(message.content);
  const embedding = await generateEmbedding(searchText);

  await db.message.update({
    where: { id: messageId },
    data: {
      searchText,
      embedding: JSON.stringify(embedding),
    },
  });
}

// Hybrid search: combines keyword and semantic search
export async function hybridSearch(
  query: string,
  options: {
    channelId?: string;
    threadId?: string;
    userId?: string;
    limit?: number;
  } = {}
) {
  const { channelId, threadId, userId, limit = 20 } = options;

  // Keyword search: simple text matching
  const keywordResults = await db.message.findMany({
    where: {
      ...(channelId && {
        thread: { channelId },
      }),
      ...(threadId && { threadId }),
      ...(userId && { userId }),
      searchText: {
        contains: query,
      },
    },
    include: {
      user: true,
      thread: {
        include: {
          channel: true,
        },
      },
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Semantic search: vector similarity
  const queryEmbedding = await generateEmbedding(query);
  const allMessages = await db.message.findMany({
    where: {
      ...(channelId && {
        thread: { channelId },
      }),
      ...(threadId && { threadId }),
      ...(userId && { userId }),
      embedding: {
        not: null,
      },
    },
    include: {
      user: true,
      thread: {
        include: {
          channel: true,
        },
      },
    },
    take: limit * 2, // Get more for similarity filtering
  });

  // Calculate similarities
  const semanticResults = allMessages
    .map((msg) => {
      if (!msg.embedding) return null;
      try {
        const embedding = JSON.parse(msg.embedding) as number[];
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        return { message: msg, similarity };
      } catch {
        return null;
      }
    })
    .filter((r): r is { message: typeof allMessages[0]; similarity: number } => r !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((r) => r.message);

  // Combine and deduplicate results
  const keywordIds = new Set(keywordResults.map((m) => m.id));
  const semanticIds = new Set(semanticResults.map((m) => m.id));

  // Merge: keyword results first (higher precision), then semantic
  const combined = [
    ...keywordResults,
    ...semanticResults.filter((m) => !keywordIds.has(m.id)),
  ].slice(0, limit);

  return {
    results: combined,
    keywordCount: keywordResults.length,
    semanticCount: semanticResults.length,
    total: combined.length,
  };
}
