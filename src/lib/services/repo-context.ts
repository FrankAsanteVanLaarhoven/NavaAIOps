import { db } from '../db';
import { getGitHubRepoContent, parseGitHubUrl } from './github';
import { generateEmbedding } from './embedding';

/**
 * Repo-Context Service
 * Stores GitHub repository files in database for fast RAG queries
 */

export interface RepoFileData {
  repoId: string;
  filePath: string;
  content: string;
  commitSha?: string;
  branch?: string;
  language?: string;
}

/**
 * Index a repository file
 */
export async function indexRepoFile(data: RepoFileData) {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(data.content);

    // Store in database
    const repoFile = await db.repoFile.upsert({
      where: {
        repoId_filePath_commitSha: {
          repoId: data.repoId,
          filePath: data.filePath,
          commitSha: data.commitSha || 'HEAD',
        },
      },
      create: {
        repoId: data.repoId,
        filePath: data.filePath,
        content: data.content,
        commitSha: data.commitSha,
        branch: data.branch || 'main',
        language: data.language,
        embedding: JSON.stringify(embedding),
        size: Buffer.byteLength(data.content, 'utf8'),
      },
      update: {
        content: data.content,
        embedding: JSON.stringify(embedding),
        updatedAt: new Date(),
      },
    });

    return repoFile;
  } catch (error: any) {
    console.error('Failed to index repo file:', error);
    throw error;
  }
}

/**
 * Index multiple files from a GitHub repository
 */
export async function indexRepoFiles(
  repoUrl: string,
  filePaths: string[],
  token?: string
) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub URL');
  }

  const { owner, repo } = parsed;
  const repoId = `${owner}/${repo}`;

  const results = [];

  for (const filePath of filePaths) {
    try {
      const content = await getGitHubRepoContent(owner, repo, filePath, token);
      
      // Detect language from file extension
      const language = detectLanguage(filePath);

      await indexRepoFile({
        repoId,
        filePath,
        content,
        branch: 'main',
        language,
      });

      results.push({ filePath, success: true });
    } catch (error: any) {
      console.error(`Failed to index ${filePath}:`, error);
      results.push({ filePath, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Search repository files
 */
export async function searchRepoFiles(
  query: string,
  repoId?: string,
  limit: number = 10
) {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Get files
  const files = await db.repoFile.findMany({
    where: repoId ? { repoId } : undefined,
    take: limit * 2, // Get more for similarity filtering
  });

  // Calculate similarities
  const results = files
    .map((file) => {
      if (!file.embedding) return null;
      try {
        const embedding = JSON.parse(file.embedding) as number[];
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        return { file, similarity };
      } catch {
        return null;
      }
    })
    .filter((r): r is { file: typeof files[0]; similarity: number } => 
      r !== null && r.similarity > 0.7
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((r) => r.file);

  return results;
}

/**
 * Get repository file content
 */
export async function getRepoFile(repoId: string, filePath: string) {
  return db.repoFile.findFirst({
    where: {
      repoId,
      filePath,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

/**
 * Detect programming language from file path
 */
function detectLanguage(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    rb: 'ruby',
    php: 'php',
    sql: 'sql',
    md: 'markdown',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
  };
  return ext ? languageMap[ext] || null : null;
}

/**
 * Cosine similarity helper
 */
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
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
