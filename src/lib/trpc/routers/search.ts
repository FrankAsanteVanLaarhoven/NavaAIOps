import { z } from 'zod';
import { router, publicProcedure } from '../_app';
import { db } from '../../db';
import { generateEmbedding, cosineSimilarity } from '../../services/embedding';
// Note: extractSearchText is used in the search service, not needed here

export const searchRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        channelId: z.string().optional(),
        threadId: z.string().optional(),
        semantic: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { query, channelId, threadId, semantic, limit } = input;

      // 1. Keyword search (always performed)
      const keywordResults = await db.message.findMany({
        where: {
          ...(channelId && {
            thread: { channelId },
          }),
          ...(threadId && { threadId }),
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

      if (!semantic) {
        return {
          results: keywordResults,
          keywordCount: keywordResults.length,
          semanticCount: 0,
          total: keywordResults.length,
        };
      }

      // 2. Semantic search (vector similarity)
      try {
        const queryEmbedding = await generateEmbedding(query);
        
        // Get all messages with embeddings
        const allMessages = await db.message.findMany({
          where: {
            ...(channelId && {
              thread: { channelId },
            }),
            ...(threadId && { threadId }),
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
            embeddings: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
          take: limit * 2, // Get more for similarity filtering
        });

        // Calculate similarities
        const semanticResults = allMessages
          .map((msg) => {
            // Try to get embedding from MessageEmbedding table first
            let embedding: number[] | null = null;
            
            if (msg.embeddings && msg.embeddings.length > 0) {
              try {
                embedding = JSON.parse(msg.embeddings[0].embedding) as number[];
              } catch {
                // Fallback to message.embedding
              }
            }
            
            if (!embedding && msg.embedding) {
              try {
                embedding = JSON.parse(msg.embedding) as number[];
              } catch {
                return null;
              }
            }

            if (!embedding) return null;

            const similarity = cosineSimilarity(queryEmbedding, embedding);
            return { message: msg, similarity };
          })
          .filter((r): r is { message: typeof allMessages[0]; similarity: number } => 
            r !== null && r.similarity > 0.7 // Threshold
          )
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit)
          .map((r) => r.message);

        // Combine and deduplicate
        const keywordIds = new Set(keywordResults.map((m) => m.id));
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
      } catch (error) {
        console.error('Semantic search failed:', error);
        // Fallback to keyword only
        return {
          results: keywordResults,
          keywordCount: keywordResults.length,
          semanticCount: 0,
          total: keywordResults.length,
        };
      }
    }),
});
