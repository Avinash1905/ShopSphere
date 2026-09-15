export interface IPRequestRecord {
  ip: string;
  subnetCidr: string; // /24 prefix
  requestTimestampMs: number;
}

export interface DDoSDefenseDecision {
  ip: string;
  allowed: boolean;
  action: 'ALLOW' | 'THROTTLE' | 'CHALLENGE_CAPTCHA' | 'TEMPORARY_BAN';
  retryAfterSeconds?: number;
  currentRequestsInWindow: number;
  reputationScore: number; // 0 (bad) to 100 (good)
}

export class DistributedDDOSSynGuard {
  private ipHistory: Map<string, number[]> = new Map();
  private bannedUntil: Map<string, number> = new Map();
  private banStreakCount: Map<string, number> = new Map();
  private windowDurationMs: number;
  private maxRequestsPerWindow: number;

  constructor(windowDurationMs: number = 60000, maxRequestsPerWindow: number = 100) {
    this.windowDurationMs = windowDurationMs;
    this.maxRequestsPerWindow = maxRequestsPerWindow;
  }

  /**
   * Extracts /24 subnet string from IPv4 address
   */
  public static extractSubnet24(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return ip;
  }

  /**
   * Evaluates incoming request from an IP address against rate and DDoS bounds
   */
  public evaluateRequest(ip: string, nowMs: number = Date.now()): DDoSDefenseDecision {
    // 1. Check if currently banned
    const bannedExpiry = this.bannedUntil.get(ip);
    if (bannedExpiry && nowMs < bannedExpiry) {
      const remainingSec = Math.ceil((bannedExpiry - nowMs) / 1000);
      return {
        ip,
        allowed: false,
        action: 'TEMPORARY_BAN',
        retryAfterSeconds: remainingSec,
        currentRequestsInWindow: this.maxRequestsPerWindow * 2,
        reputationScore: 0,
      };
    }

    // 2. Fetch or initialize history
    if (!this.ipHistory.has(ip)) {
      this.ipHistory.set(ip, []);
    }
    const timestamps = this.ipHistory.get(ip)!;

    // Prune events outside rolling window
    const cutoff = nowMs - this.windowDurationMs;
    const activeTimestamps = timestamps.filter((t) => t >= cutoff);
    activeTimestamps.push(nowMs);
    this.ipHistory.set(ip, activeTimestamps);

    const count = activeTimestamps.length;

    // 3. Rate and Ban Logic
    if (count > this.maxRequestsPerWindow * 2) {
      // Severe flood: enforce progressive ban (5m, 1h, 24h)
      const streak = (this.banStreakCount.get(ip) || 0) + 1;
      this.banStreakCount.set(ip, streak);
      const banMinutes = streak === 1 ? 5 : streak === 2 ? 60 : 1440;
      const banExpiry = nowMs + banMinutes * 60 * 1000;
      this.bannedUntil.set(ip, banExpiry);

      return {
        ip,
        allowed: false,
        action: 'TEMPORARY_BAN',
        retryAfterSeconds: banMinutes * 60,
        currentRequestsInWindow: count,
        reputationScore: 5,
      };
    }

    if (count > this.maxRequestsPerWindow) {
      return {
        ip,
        allowed: false,
        action: 'THROTTLE',
        retryAfterSeconds: 10,
        currentRequestsInWindow: count,
        reputationScore: 35,
      };
    }

    if (count > this.maxRequestsPerWindow * 0.8) {
      return {
        ip,
        allowed: true,
        action: 'CHALLENGE_CAPTCHA',
        currentRequestsInWindow: count,
        reputationScore: 65,
      };
    }

    return {
      ip,
      allowed: true,
      action: 'ALLOW',
      currentRequestsInWindow: count,
      reputationScore: 95,
    };
  }

  public clear(): void {
    this.ipHistory.clear();
    this.bannedUntil.clear();
    this.banStreakCount.clear();
  }
}
