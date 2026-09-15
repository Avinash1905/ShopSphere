export interface TrafficLoadMetrics {
  totalVirtualUsers: number;
  totalJourneysAttempted: number;
  successfulJourneys: number;
  failedJourneys: number;
  requestsCompleted: number;
  durationMs: number;
  averageRps: number;
  errorRatePercent: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
}

export class LoadTrafficGenerator {
  /**
   * Executes a simulated load test with virtual users executing multi-step shopping journeys
   */
  public static async executeLoadTest(
    virtualUsersCount: number,
    iterationsPerUser: number,
    journeyFn: (userId: string, iteration: number) => Promise<boolean>
  ): Promise<TrafficLoadMetrics> {
    const startTime = Date.now();
    const latencies: number[] = [];
    let successful = 0;
    let failed = 0;
    let totalReqs = 0;

    const userPromises: Promise<void>[] = [];

    for (let u = 0; u < virtualUsersCount; u++) {
      const userId = `VU-${u + 1}`;
      const userJob = (async () => {
        for (let iter = 0; iter < iterationsPerUser; iter++) {
          const reqStart = Date.now();
          totalReqs++;
          try {
            const ok = await journeyFn(userId, iter);
            if (ok) successful++;
            else failed++;
          } catch {
            failed++;
          }
          latencies.push(Date.now() - reqStart);
        }
      })();
      userPromises.push(userJob);
    }

    await Promise.all(userPromises);
    const totalDuration = Math.max(1, Date.now() - startTime);

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

    const totalJourneys = virtualUsersCount * iterationsPerUser;
    const errorRate = totalJourneys > 0 ? Math.round((failed / totalJourneys) * 10000) / 100 : 0;
    const rps = Math.round((totalReqs / (totalDuration / 1000)) * 100) / 100;

    return {
      totalVirtualUsers: virtualUsersCount,
      totalJourneysAttempted: totalJourneys,
      successfulJourneys: successful,
      failedJourneys: failed,
      requestsCompleted: totalReqs,
      durationMs: totalDuration,
      averageRps: rps,
      errorRatePercent: errorRate,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
    };
  }
}
