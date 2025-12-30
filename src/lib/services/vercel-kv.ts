import { kv } from '@vercel/kv';

/**
 * Vercel KV - Serverless Key-Value Store
 * Used for: Sessions, rate limits, feature flags, cache
 */

export class VercelKVService {
  /**
   * Get a value from KV store
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      return await kv.get<T>(key);
    } catch (error) {
      console.error(`KV get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in KV store
   */
  static async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    try {
      await kv.set(key, value, options);
    } catch (error) {
      console.error(`KV set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a key from KV store
   */
  static async delete(key: string): Promise<void> {
    try {
      await kv.del(key);
    } catch (error) {
      console.error(`KV delete error for key ${key}:`, error);
    }
  }

  /**
   * Increment a counter (for rate limiting)
   */
  static async increment(key: string, ttl?: number): Promise<number> {
    try {
      const count = await kv.incr(key);
      if (ttl) {
        await kv.expire(key, ttl);
      }
      return count;
    } catch (error) {
      console.error(`KV increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Check rate limit
   */
  static async checkRateLimit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `ratelimit:${identifier}`;
    const count = await this.increment(key, window);
    const resetAt = Date.now() + window * 1000;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  }

  /**
   * Get user session
   */
  static async getSession(userId: string): Promise<any | null> {
    return this.get(`session:${userId}`);
  }

  /**
   * Set user session
   */
  static async setSession(userId: string, session: any, ttl: number = 86400): Promise<void> {
    await this.set(`session:${userId}`, session, { ex: ttl });
  }

  /**
   * Get feature flag
   */
  static async getFeatureFlag(flag: string): Promise<boolean> {
    const value = await this.get<boolean>(`feature:${flag}`);
    return value ?? false;
  }

  /**
   * Set feature flag
   */
  static async setFeatureFlag(flag: string, enabled: boolean): Promise<void> {
    await this.set(`feature:${flag}`, enabled);
  }
}
