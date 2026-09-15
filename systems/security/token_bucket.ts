export interface TokenBucketState {
  tokens: number;
  lastRefillTimestamp: number;
}

export class TokenBucketRateLimiter {
  private capacity: number;
  private refillTokensPerSecond: number;
  private buckets: Map<string, TokenBucketState> = new Map();

  constructor(capacity: number = 60, refillTokensPerSecond: number = 10) {
    this.capacity = capacity;
    this.refillTokensPerSecond = refillTokensPerSecond;
  }

  public tryConsume(key: string, tokens: number = 1): { allowed: boolean; remainingTokens: number; resetTimeSeconds: number } {
    const now = Date.now();
    let state = this.buckets.get(key);

    if (!state) {
      state = {
        tokens: this.capacity,
        lastRefillTimestamp: now,
      };
      this.buckets.set(key, state);
    } else {
      // Calculate token refill
      const elapsedSeconds = (now - state.lastRefillTimestamp) / 1000;
      const refilled = elapsedSeconds * this.refillTokensPerSecond;
      state.tokens = Math.min(this.capacity, state.tokens + refilled);
      state.lastRefillTimestamp = now;
    }

    if (state.tokens >= tokens) {
      state.tokens -= tokens;
      return {
        allowed: true,
        remainingTokens: Math.floor(state.tokens),
        resetTimeSeconds: Math.ceil((this.capacity - state.tokens) / this.refillTokensPerSecond),
      };
    }

    const missingTokens = tokens - state.tokens;
    const retryAfterSeconds = Math.ceil(missingTokens / this.refillTokensPerSecond);

    return {
      allowed: false,
      remainingTokens: 0,
      resetTimeSeconds: retryAfterSeconds,
    };
  }

  public reset(key: string): void {
    this.buckets.delete(key);
  }
}
