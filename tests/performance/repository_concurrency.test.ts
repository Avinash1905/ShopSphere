import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { FixturesLoader } from '../../systems/testing/fixtures_loader.js';
import { PerformanceBenchmark } from '../../systems/testing/performance_benchmark.js';

describe('Performance: Repository Concurrency Benchmark Test', () => {
  it('should execute 500 concurrent stock operations with version locking safety', async () => {
    const { uow } = await FixturesLoader.setupTestDatabase();
    const variantId = 'var-mbp16-512';

    // Increase stock for benchmark
    const inv = await uow.inventory.findByVariantId(variantId);
    await uow.inventory.update(inv!.id, { quantity_on_hand: 10000, quantity_available: 10000 });

    const benchmark = await PerformanceBenchmark.run(
      'Atomic Inventory Concurrency Benchmark',
      200,
      async (idx) => {
        if (idx % 2 === 0) {
          await uow.inventory.reserveStock(variantId, 1);
        } else {
          await uow.inventory.releaseReservation(variantId, 1);
        }
      },
      10
    );

    console.log('\n' + PerformanceBenchmark.formatResult(benchmark));

    Assert.greaterThan(benchmark.opsPerSecond, 500, 'Inventory concurrency throughput exceeds 500 ops/sec');
  });
});
