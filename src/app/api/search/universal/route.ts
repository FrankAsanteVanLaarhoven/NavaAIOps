import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { searchRepoFiles } from '@/lib/services/repo-context';
import { extractSearchText } from '@/lib/search';

const searchSchema = z.object({
  q: z.string().min(1),
  type: z.enum(['code', 'incident', 'message', 'all']).optional().default('all'),
  channelId: z.string().optional(),
  threadId: z.string().optional(),
  repoId: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
});

/**
 * Universal Search - Search across messages, incidents, and code
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = searchSchema.parse({
      q: searchParams.get('q'),
      type: searchParams.get('type') || 'all',
      channelId: searchParams.get('channelId') || undefined,
      threadId: searchParams.get('threadId') || undefined,
      repoId: searchParams.get('repoId') || undefined,
      limit: parseInt(searchParams.get('limit') || '20', 10),
    });

    const { q, type, channelId, threadId, repoId, limit } = params;
    const results: Array<{
      type: string;
      id: string;
      title?: string;
      content?: string;
      filePath?: string;
      similarity?: number;
    }> = [];

    // 1. Search Messages
    if (type === 'all' || type === 'message') {
      const messages = await db.message.findMany({
        where: {
          ...(channelId && {
            thread: { channelId },
          }),
          ...(threadId && { threadId }),
          searchText: {
            contains: q,
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

      results.push(
        ...messages.map((m) => ({
          type: 'message',
          id: m.id,
          title: `Message in ${m.thread.channel.name}`,
          content: m.searchText || extractSearchText(m.content),
        }))
      );
    }

    // 2. Search Incidents
    if (type === 'all' || type === 'incident') {
      const incidents = await db.incidentData.findMany({
        where: {
          OR: [
            { impact: { contains: q } },
            { rootCause: { contains: q } },
            { fix: { contains: q } },
          ],
        },
        include: {
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

      results.push(
        ...incidents.map((i) => ({
          type: 'incident',
          id: i.id,
          title: `Incident: ${i.severity} - ${i.status}`,
          content: `${i.impact || ''} ${i.rootCause || ''}`.trim(),
        }))
      );
    }

    // 3. Search Code (Repo Files)
    if (type === 'all' || type === 'code') {
      const repoFiles = await searchRepoFiles(q, repoId, limit);

      results.push(
        ...repoFiles.map((f) => ({
          type: 'code',
          id: f.id,
          title: f.filePath,
          content: f.content.slice(0, 500), // Preview
          filePath: f.filePath,
        }))
      );
    }

    // Sort by relevance (incidents first, then messages, then code)
    const sortedResults = results.sort((a, b) => {
      const typeOrder = { incident: 0, message: 1, code: 2 };
      return (typeOrder[a.type as keyof typeof typeOrder] || 3) - 
             (typeOrder[b.type as keyof typeof typeOrder] || 3);
    });

    return NextResponse.json({
      query: q,
      type,
      results: sortedResults.slice(0, limit),
      counts: {
        messages: results.filter((r) => r.type === 'message').length,
        incidents: results.filter((r) => r.type === 'incident').length,
        code: results.filter((r) => r.type === 'code').length,
      },
      total: sortedResults.length,
    });
  } catch (error: any) {
    console.error('Universal search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
