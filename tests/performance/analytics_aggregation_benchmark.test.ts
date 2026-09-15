import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { AggregationEngine } from '../../systems/analytics/aggregation_engine.js';
import { TimeSeriesEngine } from '../../systems/analytics/time_series.js';
import { PerformanceBenchmark } from '../../systems/testing/performance_benchmark.js';

describe('Performance: Analytics Aggregation Benchmark Test', () => {
  it('should bucket and aggregate 10,000 transaction events in under 50ms', async () => {
    const rawEvents: { id: string; category: string; amount: number; date: string }[] = [];
    const categories = ['Electronics', 'Apparel', 'Home & Kitchen', 'Books', 'Sports'];

    for (let i = 0; i < 10000; i++) {
      const day = (i % 30) + 1;
      rawEvents.push({
        id: `ev-${i}`,
        category: categories[i % categories.length],
        amount: 20 + (i % 500),
        date: `2026-09-${day.toString().padStart(2, '0')}T12:00:00Z`,
      });
    }

    const benchmark = await PerformanceBenchmark.run(
      '10,000-Record Aggregation & Time-Series Bucketing Benchmark',
      50,
      () => {
        // 1. Group by category
        const groups = AggregationEngine.groupBy(rawEvents, (e) => e.category);
        for (const g of groups.values()) {
          g.sumField('amount');
          g.avgField('amount');
        }

        // 2. Time series daily bucketing
        TimeSeriesEngine.bucketItems(
          rawEvents,
          (e) => e.date,
          (e) => e.amount,
          'DAILY'
        );
      },
      5
    );

    console.log('\n' + PerformanceBenchmark.formatResult(benchmark));

    Assert.lessThan(benchmark.avgLatencyMs, 50.0, 'Average aggregation latency is under 50ms');
  });
});
