import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { indexRepoFiles } from '@/lib/services/repo-context';
import { getGitHubRepoTree } from '@/lib/services/github';

const schema = z.object({
  repoUrl: z.string().url(),
  filePaths: z.array(z.string()).optional(),
  token: z.string().optional(),
});

/**
 * Index GitHub repository files for RAG
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl, filePaths, token } = schema.parse(body);

    let filesToIndex = filePaths;

    // If no file paths provided, get all files from repo
    if (!filesToIndex || filesToIndex.length === 0) {
      const parsed = new URL(repoUrl);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length < 2) {
        return NextResponse.json(
          { error: 'Invalid GitHub URL' },
          { status: 400 }
        );
      }

      const owner = parts[0];
      const repo = parts[1];

      const tree = await getGitHubRepoTree(owner, repo, 'main', token);
      filesToIndex = tree
        .filter((item) => item.path && !item.path.includes('node_modules'))
        .map((item) => item.path!)
        .slice(0, 100); // Limit to 100 files
    }

    const results = await indexRepoFiles(repoUrl, filesToIndex, token);

    return NextResponse.json({
      success: true,
      indexed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error('Repo indexing error:', error);
    return NextResponse.json(
      { error: error.message || 'Indexing failed' },
      { status: 500 }
    );
  }
}
