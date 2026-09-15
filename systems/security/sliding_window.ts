export class SlidingWindowRateLimiter {
  private windowSizeMs: number;
  private maxRequests: number;
  // Key -> array of epoch millisecond timestamps
  private requestLogs: Map<string, number[]> = new Map();

  constructor(maxRequests: number = 100, windowSeconds: number = 60) {
    this.maxRequests = maxRequests;
    this.windowSizeMs = windowSeconds * 1000;
  }

  public checkLimit(key: string): { allowed: boolean; currentCount: number; remaining: number; resetMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowSizeMs;

    let timestamps = this.requestLogs.get(key) || [];
    // Filter timestamps within current rolling window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= this.maxRequests) {
      const oldestInWindow = timestamps[0];
      const resetMs = Math.max(0, oldestInWindow + this.windowSizeMs - now);
      this.requestLogs.set(key, timestamps);

      return {
        allowed: false,
        currentCount: timestamps.length,
        remaining: 0,
        resetMs,
      };
    }

    timestamps.push(now);
    this.requestLogs.set(key, timestamps);

    return {
      allowed: true,
      currentCount: timestamps.length,
      remaining: this.maxRequests - timestamps.length,
      resetMs: this.windowSizeMs,
    };
  }

  public reset(key: string): void {
    this.requestLogs.delete(key);
  }
}
