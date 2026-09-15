import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { SearchPipeline } from '../../systems/search/search_pipeline.js';
import { PerformanceBenchmark } from '../../systems/testing/performance_benchmark.js';

describe('Performance: Search Engine Benchmark Test', () => {
  it('should achieve > 5,000 queries/sec with p95 latency under 1ms', async () => {
    const pipeline = new SearchPipeline();

    // Index 100 products
    for (let i = 0; i < 100; i++) {
      pipeline.indexProduct({
        id: `prod-bench-${i}`,
        title: `High Performance Laptop Ultra Pro Edition ${i}`,
        description: `Cutting edge flagship notebook with 64GB memory, 2TB SSD, and titanium enclosure for developers #${i}`,
        brandName: i % 2 === 0 ? 'Apple' : 'Sony',
        categoryName: 'Laptops',
        tags: ['laptop', 'ultra', 'm3', 'performance', `tag-${i}`],
        attributes: { base_price: 1000 + i * 10, rating_average: 4.5, total_sales_count: 500 + i },
      });
    }

    const queries = ['Apple Laptop', 'Ultra Pro', 'Sony Edition', 'High Performance 64GB', 'Titanium notebook'];

    const benchmark = await PerformanceBenchmark.run(
      'Inverted Index BM25 Search Benchmark',
      500,
      (idx) => {
        const query = queries[idx % queries.length];
        pipeline.execute({ query });
      },
      20
    );

    console.log('\n' + PerformanceBenchmark.formatResult(benchmark));

    Assert.greaterThan(benchmark.opsPerSecond, 1000, 'Search throughput exceeds 1,000 QPS');
    Assert.lessThan(benchmark.p95LatencyMs, 5.0, 'p95 latency is under 5ms');
  });
});
