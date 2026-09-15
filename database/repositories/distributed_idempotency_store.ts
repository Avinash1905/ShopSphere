/**
 * ShopSphere Database Repositories - Distributed Idempotency Store
 * Prevents double-processing of payment transactions, orders, and stateful mutations
 */

import * as crypto from 'crypto';

export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  responsePayload?: any;
  statusCode?: number;
  lockedUntil: number; // Unix timestamp in ms
  createdAt: number;
}

export class DistributedIdempotencyStore {
  private records: Map<string, IdempotencyRecord> = new Map();
  private defaultLockTtlMs: number;
  private defaultRetentionMs: number;

  constructor(defaultLockTtlMs: number = 30000, defaultRetentionMs: number = 86400000) {
    this.defaultLockTtlMs = defaultLockTtlMs;
    this.defaultRetentionMs = defaultRetentionMs;
  }

  /**
   * Computes a SHA-256 fingerprint for request parameters
   */
  public static hashRequest(payload: any): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Attempts to acquire an idempotent execution lock
   */
  public async acquire(
    idempotencyKey: string,
    requestHash: string,
    lockTtlMs?: number
  ): Promise<{ status: 'ACQUIRED' | 'CACHED' | 'IN_FLIGHT_CONFLICT'; cachedResponse?: any }> {
    const now = Date.now();
    const ttl = lockTtlMs ?? this.defaultLockTtlMs;
    const existing = this.records.get(idempotencyKey);

    if (existing) {
      if (existing.status === 'COMPLETED') {
        // Return cached result
        return {
          status: 'CACHED',
          cachedResponse: existing.responsePayload,
        };
      }

      if (existing.status === 'PROCESSING') {
        if (existing.lockedUntil > now) {
          // Still locked in-flight by another concurrent worker
          return { status: 'IN_FLIGHT_CONFLICT' };
        }
        // Lock expired without completion (worker crash), allow takeover
      }
    }

    // Acquire lock
    this.records.set(idempotencyKey, {
      key: idempotencyKey,
      requestHash,
      status: 'PROCESSING',
      lockedUntil: now + ttl,
      createdAt: now,
    });

    return { status: 'ACQUIRED' };
  }

  /**
   * Commits the idempotent execution result
   */
  public async commit(idempotencyKey: string, responsePayload: any, statusCode: number = 200): Promise<void> {
    const existing = this.records.get(idempotencyKey);
    if (existing) {
      existing.status = 'COMPLETED';
      existing.responsePayload = responsePayload;
      existing.statusCode = statusCode;
    }
  }

  /**
   * Releases an uncompleted lock on error
   */
  public async release(idempotencyKey: string): Promise<void> {
    this.records.delete(idempotencyKey);
  }

  /**
   * Clean up expired records beyond retention period
   */
  public prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, record] of this.records.entries()) {
      if (now - record.createdAt > this.defaultRetentionMs) {
        this.records.delete(key);
        pruned++;
      }
    }
    return pruned;
  }
}
