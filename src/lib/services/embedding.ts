import OpenAI from 'openai';

/**
 * Generate embedding vector for text using OpenAI's embedding model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback to simple hash-based vector if no API key
    console.warn('OPENAI_API_KEY not set, using fallback embedding');
    return generateFallbackEmbedding(text);
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit to 8000 chars
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error('Failed to generate embedding:', error);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback embedding generator (simple hash-based)
 * Used when OpenAI API is not available
 */
function generateFallbackEmbedding(text: string): number[] {
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const vector: number[] = [];
  const dimension = 1536; // Match OpenAI embedding dimension
  for (let i = 0; i < dimension; i++) {
    vector.push(Math.abs(Math.sin(hash + i)) % 1);
  }
  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
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
