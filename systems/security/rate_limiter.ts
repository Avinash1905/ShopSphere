import { TokenBucketRateLimiter } from './token_bucket.js';
import { SlidingWindowRateLimiter } from './sliding_window.js';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  penaltyBlocked?: boolean;
}

export class SecurityRateLimiter {
  private tokenBucket: TokenBucketRateLimiter;
  private slidingWindow: SlidingWindowRateLimiter;
  private blockedIps: Map<string, number> = new Map(); // IP -> unblock timestamp

  constructor() {
    this.tokenBucket = new TokenBucketRateLimiter(60, 5); // 60 burst, 5/sec refill
    this.slidingWindow = new SlidingWindowRateLimiter(120, 60); // 120 per minute
  }

  public checkRequest(ip: string, userId?: string, endpoint?: string): RateLimitResult {
    const now = Date.now();

    // Check penalty block
    const blockUntil = this.blockedIps.get(ip);
    if (blockUntil && now < blockUntil) {
      return {
        allowed: false,
        limit: 0,
        remaining: 0,
        retryAfterSeconds: Math.ceil((blockUntil - now) / 1000),
        penaltyBlocked: true,
      };
    } else if (blockUntil) {
      this.blockedIps.delete(ip);
    }

    const rateKey = userId ? `user:${userId}` : `ip:${ip}`;
    const windowRes = this.slidingWindow.checkLimit(rateKey);

    if (!windowRes.allowed) {
      return {
        allowed: false,
        limit: 120,
        remaining: 0,
        retryAfterSeconds: Math.ceil(windowRes.resetMs / 1000),
      };
    }

    const tokenRes = this.tokenBucket.tryConsume(rateKey);
    return {
      allowed: tokenRes.allowed,
      limit: 60,
      remaining: tokenRes.remainingTokens,
      retryAfterSeconds: tokenRes.resetTimeSeconds,
    };
  }

  public applyPenaltyBlock(ip: string, durationMinutes: number = 15): void {
    const unblockTime = Date.now() + durationMinutes * 60 * 1000;
    this.blockedIps.set(ip, unblockTime);
  }
}
