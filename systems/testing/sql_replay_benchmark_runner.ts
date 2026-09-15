import { MigrationDatabaseAdapter } from '../../database/migrations/runner.js';

export interface SQLWorkloadItem {
  sql: string;
  params?: any[];
  expectedMaxDurationMs?: number;
}

export interface SQLReplayBenchmarkSummary {
  totalQueriesExecuted: number;
  totalDurationMs: number;
  throughputQps: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  slowQueryCount: number;
  slowQueries: Array<{ sql: string; durationMs: number }>;
}

export class SQLReplayBenchmarkRunner {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Replays a batch of SQL queries and records precise latency percentiles
   */
  public async replayWorkload(
    workload: SQLWorkloadItem[],
    slowQueryThresholdMs: number = 20
  ): Promise<SQLReplayBenchmarkSummary> {
    const latencies: number[] = [];
    const slowQueries: Array<{ sql: string; durationMs: number }> = [];

    const startTime = Date.now();

    for (const item of workload) {
      const qStart = Date.now();
      try {
        if (/^SELECT/i.test(item.sql.trim())) {
          await this.db.query(item.sql, item.params || []);
        } else {
          await this.db.execute(item.sql, item.params || []);
        }
      } catch (err: any) {
        // Continue replay
      }
      const duration = Math.max(0.1, Date.now() - qStart);
      latencies.push(duration);

      if (duration >= slowQueryThresholdMs) {
        slowQueries.push({ sql: item.sql, durationMs: duration });
      }
    }

    const totalDuration = Math.max(1, Date.now() - startTime);
    latencies.sort((a, b) => a - b);

    const count = latencies.length;
    const sum = latencies.reduce((acc, v) => acc + v, 0);
    const avg = count > 0 ? sum / count : 0;
    const p50 = latencies[Math.floor(count * 0.5)] || 0;
    const p95 = latencies[Math.floor(count * 0.95)] || 0;
    const p99 = latencies[Math.floor(count * 0.99)] || 0;
    const qps = Math.round((count / (totalDuration / 1000)) * 100) / 100;

    return {
      totalQueriesExecuted: count,
      totalDurationMs: totalDuration,
      throughputQps: qps,
      avgLatencyMs: Math.round(avg * 100) / 100,
      p50LatencyMs: Math.round(p50 * 100) / 100,
      p95LatencyMs: Math.round(p95 * 100) / 100,
      p99LatencyMs: Math.round(p99 * 100) / 100,
      slowQueryCount: slowQueries.length,
      slowQueries: slowQueries.slice(0, 10),
    };
  }
}
