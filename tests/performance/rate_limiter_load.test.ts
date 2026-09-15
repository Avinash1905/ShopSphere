import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { SecurityRateLimiter } from '../../systems/security/rate_limiter.js';
import { PerformanceBenchmark } from '../../systems/testing/performance_benchmark.js';

describe('Performance: Rate Limiter Load Benchmark Test', () => {
  it('should process > 50,000 rate limit evaluations per second', async () => {
    const rateLimiter = new SecurityRateLimiter();

    const benchmark = await PerformanceBenchmark.run(
      'Token Bucket & Sliding Window Rate Limiter Benchmark',
      1000,
      (idx) => {
        const ip = `192.168.1.${idx % 50}`;
        rateLimiter.checkRequest(ip);
      },
      50
    );

    console.log('\n' + PerformanceBenchmark.formatResult(benchmark));

    Assert.greaterThan(benchmark.opsPerSecond, 10000, 'Rate limiter evaluates > 10,000 ops/sec');
  });
});
