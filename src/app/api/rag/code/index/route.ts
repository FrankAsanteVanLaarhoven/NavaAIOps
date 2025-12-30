import { NextRequest, NextResponse } from 'next/server';
import { indexCodeFile } from '@/lib/rag-assistant';
import { z } from 'zod';

const schema = z.object({
  repository: z.string(),
  filePath: z.string(),
  content: z.string(),
  language: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repository, filePath, content, language } = schema.parse(body);

    await indexCodeFile(repository, filePath, content, language);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to index code' },
      { status: 500 }
    );
  }
}
