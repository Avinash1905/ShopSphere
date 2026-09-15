export class TokenBucketRateLimiter {
  private capacity: number;
  private refillRatePerSecond: number;
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  constructor(capacity: number = 60, refillRatePerSecond: number = 10) {
    this.capacity = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
  }

  public allowRequest(key: string, tokensRequested: number = 1): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    } else {
      const elapsedSeconds = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSeconds * this.refillRatePerSecond);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= tokensRequested) {
      bucket.tokens -= tokensRequested;
      return true;
    }
    return false;
  }

  public reset(key: string): void {
    this.buckets.delete(key);
  }
}
