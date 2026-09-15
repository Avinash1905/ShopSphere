/**
 * Sliding Window In-Memory Rate Limiter Middleware
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../core/errors/DomainErrors';
import { SystemHeaders } from '../config/constants';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  message?: string;
}

export class RateLimiter {
  private readonly store = new Map<string, RateLimitRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly keyGenerator: (req: Request) => string;
  private readonly skip: (req: Request) => boolean;
  private readonly message: string;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000;
    this.maxRequests = options.maxRequests || 100;
    this.message = options.message || 'Too many requests. Please try again later.';
    this.keyGenerator =
      options.keyGenerator ||
      ((req: Request) => {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
        return `${ip}:${req.baseUrl || req.path}`;
      });
    this.skip = options.skip || (() => false);

    // Periodic sweep every 5 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (this.skip(req)) {
        return next();
      }

      const key = this.keyGenerator(req);
      const now = Date.now();

      let record = this.store.get(key);
      if (!record || now >= record.resetAt) {
        record = {
          count: 1,
          resetAt: now + this.windowMs,
        };
        this.store.set(key, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.maxRequests - record.count);
      const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

      res.setHeader(SystemHeaders.RATE_LIMIT_LIMIT, this.maxRequests.toString());
      res.setHeader(SystemHeaders.RATE_LIMIT_REMAINING, remaining.toString());
      res.setHeader(SystemHeaders.RATE_LIMIT_RESET, resetSeconds.toString());

      if (record.count > this.maxRequests) {
        res.setHeader(SystemHeaders.RETRY_AFTER, resetSeconds.toString());
        throw new RateLimitError(resetSeconds, this.message);
      }

      next();
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetAt) {
        this.store.delete(key);
      }
    }
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }
}

export function createRateLimiter(options?: RateLimiterOptions) {
  return new RateLimiter(options).middleware();
}
