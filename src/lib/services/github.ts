import { Octokit } from '@octokit/rest';

/**
 * Get GitHub repository content
 */
export async function getGitHubRepoContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string> {
  if (!token && !process.env.GITHUB_TOKEN) {
    throw new Error('GitHub token is required');
  }

  const octokit = new Octokit({
    auth: token || process.env.GITHUB_TOKEN,
  });

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data)) {
      // Directory listing
      return JSON.stringify(data.map((item) => ({
        name: item.name,
        type: item.type,
        path: item.path,
      })));
    }

    if ('content' in data && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    return '';
  } catch (error: any) {
    console.error('Failed to fetch GitHub content:', error);
    throw new Error(`Failed to fetch GitHub content: ${error.message}`);
  }
}

/**
 * Parse GitHub URL to extract owner, repo, and path
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string; path: string } | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') {
      return null;
    }

    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1];
    const path = parts.slice(2).join('/') || 'README.md';

    return { owner, repo, path };
  } catch {
    return null;
  }
}

/**
 * Get file tree for a repository
 */
export async function getGitHubRepoTree(
  owner: string,
  repo: string,
  branch: string = 'main',
  token?: string
) {
  if (!token && !process.env.GITHUB_TOKEN) {
    throw new Error('GitHub token is required');
  }

  const octokit = new Octokit({
    auth: token || process.env.GITHUB_TOKEN,
  });

  try {
    const { data: branchData } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch,
    });

    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branchData.commit.sha,
      recursive: '1',
    });

    return treeData.tree.filter((item) => item.type === 'blob');
  } catch (error: any) {
    console.error('Failed to fetch GitHub tree:', error);
    throw new Error(`Failed to fetch GitHub tree: ${error.message}`);
  }
}
