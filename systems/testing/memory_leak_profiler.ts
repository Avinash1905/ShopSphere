export interface AllocationSnapshot {
  snapshotId: string;
  timestamp: string;
  totalTrackedObjects: number;
  allocationsByType: Record<string, number>;
  estimatedBytesRetained: number;
}

export interface MemoryLeakAlert {
  objectType: string;
  initialCount: number;
  finalCount: number;
  growthRatePercent: number;
  severity: 'WARNING' | 'CRITICAL';
  recommendation: string;
}

export class MemoryLeakProfiler {
  private activeAllocations: Map<string, Set<any>> = new Map();
  private snapshots: AllocationSnapshot[] = [];

  /**
   * Tracks an allocated object instance
   */
  public trackAllocation(objectType: string, instance: any): void {
    if (!this.activeAllocations.has(objectType)) {
      this.activeAllocations.set(objectType, new Set());
    }
    this.activeAllocations.get(objectType)!.add(instance);
  }

  /**
   * Untracks a released/garbage-collected object instance
   */
  public releaseAllocation(objectType: string, instance: any): void {
    if (this.activeAllocations.has(objectType)) {
      this.activeAllocations.get(objectType)!.delete(instance);
    }
  }

  /**
   * Captures memory allocation snapshot
   */
  public captureSnapshot(): AllocationSnapshot {
    const allocationsByType: Record<string, number> = {};
    let total = 0;

    for (const [type, set] of this.activeAllocations.entries()) {
      allocationsByType[type] = set.size;
      total += set.size;
    }

    const snap: AllocationSnapshot = {
      snapshotId: `SNAP-${Date.now()}-${this.snapshots.length + 1}`,
      timestamp: new Date().toISOString(),
      totalTrackedObjects: total,
      allocationsByType,
      estimatedBytesRetained: total * 128, // estimated ~128 bytes per JS object reference
    };

    this.snapshots.push(snap);
    return snap;
  }

  /**
   * Analyzes growth between two snapshots to flag runaway memory retention leaks
   */
  public detectLeaks(snap1: AllocationSnapshot, snap2: AllocationSnapshot): MemoryLeakAlert[] {
    const alerts: MemoryLeakAlert[] = [];

    for (const [type, count2] of Object.entries(snap2.allocationsByType)) {
      const count1 = snap1.allocationsByType[type] || 0;
      if (count1 > 0 && count2 > count1 * 1.5 && (count2 - count1) >= 10) {
        const growth = Math.round(((count2 - count1) / count1) * 100);
        alerts.push({
          objectType: type,
          initialCount: count1,
          finalCount: count2,
          growthRatePercent: growth,
          severity: growth > 300 ? 'CRITICAL' : 'WARNING',
          recommendation: `Inspect ${type} references: objects are not being properly deallocated/unregistered.`,
        });
      }
    }

    return alerts;
  }

  public clear(): void {
    this.activeAllocations.clear();
    this.snapshots = [];
  }
}
