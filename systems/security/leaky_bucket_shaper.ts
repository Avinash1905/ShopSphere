/**
 * ShopSphere Security Subsystem - Leaky Bucket Traffic Shaper & Subnet Reputation Monitor
 * Features:
 * - Constant-rate leak traffic shaper smoothing burst request spikes
 * - Subnet /24 IP grouping & threat scoring
 * - Automatic dynamic rate throttles for abusive IP clusters
 */

export interface BucketState {
  capacity: number;
  leakRatePerSec: number;
  waterLevel: number;
  lastLeakTimestamp: number;
}

export class LeakyBucketShaper {
  private static buckets: Map<string, BucketState> = new Map();
  private static subnetThreatScores: Map<string, number> = new Map();

  /**
   * Evaluates whether a request can pass through the leaky bucket
   */
  public static checkAndConsume(
    key: string,
    capacity: number = 20,
    leakRatePerSec: number = 5,
    cost: number = 1
  ): { allowed: boolean; remainingCapacity: number; estimatedWaitMs: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        capacity,
        leakRatePerSec,
        waterLevel: 0,
        lastLeakTimestamp: now,
      };
      this.buckets.set(key, bucket);
    }

    // Leak water based on elapsed time
    const elapsedSec = (now - bucket.lastLeakTimestamp) / 1000;
    bucket.waterLevel = Math.max(0, bucket.waterLevel - elapsedSec * bucket.leakRatePerSec);
    bucket.lastLeakTimestamp = now;

    if (bucket.waterLevel + cost <= bucket.capacity) {
      bucket.waterLevel += cost;
      const remaining = Math.max(0, bucket.capacity - bucket.waterLevel);
      return {
        allowed: true,
        remainingCapacity: Math.round(remaining * 10) / 10,
        estimatedWaitMs: 0,
      };
    }

    // Capacity overflow: calculate wait time for bucket to leak enough
    const excess = bucket.waterLevel + cost - bucket.capacity;
    const waitMs = Math.ceil((excess / bucket.leakRatePerSec) * 1000);

    return {
      allowed: false,
      remainingCapacity: 0,
      estimatedWaitMs: waitMs,
    };
  }

  /**
   * Tracks IP subnet abuse and flags high-risk CIDR blocks
   */
  public static reportSubnetAbuse(ip: string, penaltyPoints: number = 5): number {
    const subnet = this.extractSubnet(ip);
    const curScore = (this.subnetThreatScores.get(subnet) || 0) + penaltyPoints;
    this.subnetThreatScores.set(subnet, curScore);
    return curScore;
  }

  public static isSubnetFlagged(ip: string, threshold: number = 50): boolean {
    const subnet = this.extractSubnet(ip);
    return (this.subnetThreatScores.get(subnet) || 0) >= threshold;
  }

  private static extractSubnet(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return ip;
  }

  public static clear(): void {
    this.buckets.clear();
    this.subnetThreatScores.clear();
  }
}
