import * as crypto from 'crypto';

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
}

export class SearchLRUCache<T> {
  private capacity: number;
  private ttlMs: number;
  private map: Map<string, CacheEntry<T>> = new Map();

  constructor(capacity: number = 500, ttlSeconds: number = 300) {
    this.capacity = capacity;
    this.ttlMs = ttlSeconds * 1000;
  }

  public get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // Refresh LRU position
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  public set(key: string, value: T): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict least recently used (first key in map iterator)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey) {
        this.map.delete(oldestKey);
      }
    }

    this.map.set(key, {
      key,
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  public clear(): void {
    this.map.clear();
  }

  public size(): number {
    return this.map.size;
  }

  public static hashKey(obj: any): string {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return crypto.createHash('md5').update(str).digest('hex');
  }
}
