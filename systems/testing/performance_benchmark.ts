import { MetricsCalculator } from '../analytics/metrics_calculator.js';

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalDurationMs: number;
  opsPerSecond: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
}

export class PerformanceBenchmark {
  public static async run(
    name: string,
    iterations: number,
    operation: (iteration: number) => Promise<void> | void,
    warmupIterations: number = 10
  ): Promise<BenchmarkResult> {
    // 1. Warm-up JIT & caches
    for (let i = 0; i < warmupIterations; i++) {
      await operation(i);
    }

    // 2. Measure actual iterations
    const latencies: number[] = [];
    const overallStart = Date.now();

    for (let i = 0; i < iterations; i++) {
      const iterStart = performance.now();
      await operation(i);
      const iterEnd = performance.now();
      latencies.push(iterEnd - iterStart);
    }

    const totalDurationMs = Date.now() - overallStart;
    const opsPerSecond = Math.round((iterations / (totalDurationMs / 1000)) * 100) / 100;
    const avgLatencyMs = Math.round(MetricsCalculator.mean(latencies) * 1000) / 1000;
    const p50 = Math.round(MetricsCalculator.percentile(latencies, 50) * 1000) / 1000;
    const p95 = Math.round(MetricsCalculator.percentile(latencies, 95) * 1000) / 1000;
    const p99 = Math.round(MetricsCalculator.percentile(latencies, 99) * 1000) / 1000;
    const minLat = Math.round(Math.min(...latencies) * 1000) / 1000;
    const maxLat = Math.round(Math.max(...latencies) * 1000) / 1000;

    return {
      name,
      iterations,
      totalDurationMs,
      opsPerSecond,
      avgLatencyMs,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      minLatencyMs: minLat,
      maxLatencyMs: maxLat,
    };
  }

  public static formatResult(res: BenchmarkResult): string {
    return `[Benchmark: ${res.name}]
  - Iterations:     ${res.iterations.toLocaleString()}
  - Total Time:     ${res.totalDurationMs}ms
  - Throughput:     ${res.opsPerSecond.toLocaleString()} ops/sec
  - Avg Latency:    ${res.avgLatencyMs}ms
  - p50 Latency:    ${res.p50LatencyMs}ms
  - p95 Latency:    ${res.p95LatencyMs}ms
  - p99 Latency:    ${res.p99LatencyMs}ms
  - Min / Max:      ${res.minLatencyMs}ms / ${res.maxLatencyMs}ms`;
  }
}
