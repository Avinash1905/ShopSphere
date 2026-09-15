/**
 * ShopSphere E2U Chaos Engineering & Fault Resilience Pipeline Test
 * Tests transactional recovery, retry backoff, and circuit breaking
 * under simulated transient latency, error spikes, and network drops.
 */

import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import { ChaosFaultInjector, ChaosCircuitBreaker } from '../../systems/testing/chaos_fault_injector.js';

describe('E2E: Chaos Engineering & Resilience Pipeline Test', () => {
  it('should recover from transient database failures via retry loops and prevent corrupted state', async () => {
    const db = new MockDatabaseAdapter();
    await db.execute('CREATE TABLE user_wallet (id TEXT PRIMARY KEY, balance REAL)', []);
    await db.execute("INSERT INTO user_wallet (id, balance) VALUES ('usr-100', 500.0)", []);

    let attemptCount = 0;
    const transientTransferWithRetry = async (amount: number, maxRetries: number = 3): Promise<boolean> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        attemptCount++;
        try {
          return await ChaosFaultInjector.executeWithChaos(
            {
              failureRate: attempt === 1 ? 1.0 : 0.0,
              latencyMinMs: 2,
              latencyMaxMs: 5,
            },
            async () => {
              await db.execute('UPDATE user_wallet SET balance = balance - ? WHERE id = ?', [amount, 'usr-100']);
              return true;
            }
          );
        } catch (err) {
          if (attempt === maxRetries) throw err;
          await new Promise((r) => setTimeout(r, 10));
        }
      }
      return false;
    };

    const success = await transientTransferWithRetry(100.0);
    Assert.isTrue(success, 'Transfer should succeed after retry');
    Assert.equal(attemptCount, 2, 'Should succeed on attempt #2');

    const rows = await db.query('SELECT balance FROM user_wallet WHERE id = ?', ['usr-100']);
    Assert.equal(rows[0].balance, 400.0, 'Balance must be exactly 400.0 (no double debits)');
  });

  it('should protect downstream search index from flood exhaustion using Circuit Breaker', async () => {
    const breaker = new ChaosCircuitBreaker(3, 40);
    let downstreamCalls = 0;

    const downstreamSearchService = async (shouldFail: boolean) => {
      downstreamCalls++;
      if (shouldFail) throw new Error('Search index cluster unavailable');
      return [{ id: 'item-1', name: 'Keyboard' }];
    };

    // 1. Trigger 3 consecutive failures
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(() => downstreamSearchService(true));
      } catch {}
    }


    Assert.equal(breaker.getState(), 'OPEN');
    Assert.equal(downstreamCalls, 3);

    // 2. Next 5 requests should fast-fail without hitting downstream service
    let fastFailedRequests = 0;
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.execute(() => downstreamSearchService(true));
      } catch (err: any) {
        if (err.message.includes('CircuitBreaker is OPEN')) {
          fastFailedRequests++;
        }
      }
    }


    Assert.equal(fastFailedRequests, 5, 'All 5 requests should fast-fail');
    Assert.equal(downstreamCalls, 3, 'Downstream service should not receive any load during open circuit');

    // 3. Wait for cooldown, then verify recovery
    await new Promise((r) => setTimeout(r, 50));
    Assert.equal(breaker.getState(), 'HALF_OPEN');

    const result = await breaker.execute(() => downstreamSearchService(false));
    Assert.equal(result.length, 1);
    Assert.equal(breaker.getState(), 'CLOSED');
  });
});
