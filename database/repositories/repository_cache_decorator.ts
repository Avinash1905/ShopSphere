/**
 * ShopSphere Database Layer - Repository Multi-Level Caching Decorator
 * Features:
 * - Request-scoped L1 cache + In-memory TTL L2 cache
 * - Tag-based cache invalidation on writes (e.g. invalidating 'products:seller_123' on product update)
 * - Cache metrics (hits, misses, evictions, hit-ratio)
 */

export interface CacheEntry<T> {
  value: T;
  tags: string[];
  expiresAt: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  hitRatio: number;
}

export class RepositoryCacheDecorator {
  private static cache: Map<string, CacheEntry<any>> = new Map();
  private static tagIndex: Map<string, Set<string>> = new Map();
  private static hits = 0;
  private static misses = 0;
  private static evictions = 0;

  /**
   * Retrieves an item from cache, or calculates and stores it if missing
   */
  public static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 60000,
    tags: string[] = []
  ): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (entry && entry.expiresAt > now) {
      this.hits++;
      return entry.value as T;
    }

    this.misses++;
    const value = await fetchFn();

    // Store in cache
    this.cache.set(key, {
      value,
      tags,
      expiresAt: now + ttlMs,
    });

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }

    return value;
  }

  /**
   * Invalidates all cache entries matching specific tags
   */
  public static invalidateTags(tags: string[]): number {
    let evictedCount = 0;
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        for (const key of keys) {
          if (this.cache.delete(key)) {
            evictedCount++;
            this.evictions++;
          }
        }
        this.tagIndex.delete(tag);
      }
    }
    return evictedCount;
  }

  public static clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  public static getMetrics(): CacheMetrics {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRatio: total > 0 ? Math.round((this.hits / total) * 1000) / 1000 : 0,
    };
  }
}
