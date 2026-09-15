import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import { Arbitraries, PropertyTestRunner } from '../../systems/testing/property_based_generator.js';
import { MockTransactionAdapter, DeadlockGraph } from '../../systems/testing/nested_tx_mock_adapter.js';
import { MutationFuzzer } from '../../systems/testing/mutation_fuzzer.js';
import { ChaosFaultInjector, ChaosCircuitBreaker } from '../../systems/testing/chaos_fault_injector.js';

describe('Testing Infrastructure: Advanced Testing Systems', () => {
  it('should verify mathematical and data structure invariants using property-based generation', async () => {
    const intPairArb = Arbitraries.record({
      a: Arbitraries.integer(-10000, 10000),
      b: Arbitraries.integer(-10000, 10000),
    });

    const addCommutative = await PropertyTestRunner.forAll(
      intPairArb,
      ({ a, b }) => {
        return a + b === b + a;
      },
      { runs: 100 }
    );
    Assert.isTrue(addCommutative.passed, 'Addition commutativity invariant must hold');

    const strArb = Arbitraries.string({ minLen: 0, maxLen: 50 });
    const strIdentity = await PropertyTestRunner.forAll(
      strArb,
      (s) => {
        const reversed = s.split('').reverse().join('');
        const doubleReversed = reversed.split('').reverse().join('');
        return doubleReversed === s;
      },
      { runs: 100 }
    );
    Assert.isTrue(strIdentity.passed, 'String double reverse invariant must hold');

    const emailArb = Arbitraries.email();
    const emailValid = await PropertyTestRunner.forAll(
      emailArb,
      (email) => {
        const parts = email.split('@');
        return parts.length === 2 && parts[0].length >= 3 && parts[1].endsWith('.com');
      },
      { runs: 50 }
    );
    Assert.isTrue(emailValid.passed, 'Email arbitrary generator invariant must hold');
  });

  it('should systematically shrink failing counterexamples in property testing', async () => {
    const intArb = Arbitraries.integer(0, 1000);
    const failProp = await PropertyTestRunner.forAll(intArb, (n) => n < 42, { runs: 50, seed: 42 });
    Assert.isFalse(failProp.passed, 'Property should fail for values >= 42');
    Assert.isNotNull(failProp.failingExample, 'Failing counterexample should be captured');
    Assert.greaterThanOrEqual(failProp.shrunkExample!, 42, 'Shrunk value should remain a counterexample');
    Assert.lessThan(failProp.shrunkExample!, failProp.failingExample! + 1, 'Shrunk value should be reduced');
  });

  it('should execute in rollback sandbox and isolate state', async () => {
    const db = new MockDatabaseAdapter();
    await db.execute('CREATE TABLE test_tx (id TEXT PRIMARY KEY, value INT)', []);
    await db.execute("INSERT INTO test_tx (id, value) VALUES ('init_1', 100)", []);

    let rows = await db.query('SELECT * FROM test_tx');
    Assert.equal(rows.length, 1);

    await MockTransactionAdapter.runInRollbackSandbox(db, async (tx) => {
      await db.execute("INSERT INTO test_tx (id, value) VALUES ('mut_1', 200)", []);
      await db.execute("INSERT INTO test_tx (id, value) VALUES ('mut_2', 300)", []);

      const innerRows = await db.query('SELECT * FROM test_tx');
      Assert.equal(innerRows.length, 3, 'Inside sandbox should see 3 rows');
    });

    rows = await db.query('SELECT * FROM test_tx');
    Assert.equal(rows.length, 1, 'Outside sandbox must revert to original 1 row');
    Assert.equal(rows[0].id, 'init_1');
  });

  it('should support multiple nested savepoints and selective rollbacks', async () => {
    const db = new MockDatabaseAdapter();
    await db.execute('CREATE TABLE products_tx (id TEXT PRIMARY KEY, title TEXT, price REAL)', []);

    const tx = new MockTransactionAdapter(db);
    tx.begin('tx_test_nested');

    await db.execute("INSERT INTO products_tx (id, title, price) VALUES ('p1', 'Alpha', 10.0)", []);
    tx.savepoint('sp_alpha');

    await db.execute("INSERT INTO products_tx (id, title, price) VALUES ('p2', 'Beta', 20.0)", []);
    tx.savepoint('sp_beta');

    await db.execute("INSERT INTO products_tx (id, title, price) VALUES ('p3', 'Gamma', 30.0)", []);
    let rows = await db.query('SELECT * FROM products_tx');
    Assert.equal(rows.length, 3);

    tx.rollbackToSavepoint('sp_beta');
    rows = await db.query('SELECT * FROM products_tx');
    Assert.equal(rows.length, 2, 'Should have p1 and p2 remaining');

    tx.rollbackToSavepoint('sp_alpha');
    rows = await db.query('SELECT * FROM products_tx');
    Assert.equal(rows.length, 1, 'Should have only p1 remaining');
    Assert.equal(rows[0].id, 'p1');

    tx.commit();
  });

  it('should detect wait-for cycles and throw on deadlocks', () => {
    MockTransactionAdapter.clearDeadlockGraph();

    MockTransactionAdapter.registerLockWait('tx_1', 'tx_2');
    MockTransactionAdapter.registerLockWait('tx_2', 'tx_3');

    let threw = false;
    try {
      MockTransactionAdapter.registerLockWait('tx_3', 'tx_1');
    } catch (err: any) {
      threw = true;
      Assert.isTrue(err.message.includes('Deadlock detected'), 'Should detect deadlock cycle in graph');
    }
    Assert.isTrue(threw, 'Should throw deadlock error when cycle is closed');
  });

  it('should generate mutants and calculate mutation kill score', () => {
    const validProduct = {
      id: 'prod-001',
      title: 'Premium Ergonomic Keyboard',
      base_price: 149.99,
      is_active: true,
      reviews_count: 24,
    };

    const validator = (record: typeof validProduct) => {
      if (!record.id || !record.id.startsWith('prod-') || record.id.includes("'")) return false;
      if (!record.title || record.title.trim().length === 0 || record.title.length > 50) return false;
      if (typeof record.base_price !== 'number' || record.base_price <= 0 || record.base_price > 100000) return false;
      if (typeof record.reviews_count !== 'number' || record.reviews_count < 0 || record.reviews_count > 1000000) return false;
      if (record.title.includes('<script>')) return false;
      if (record.is_active !== true) return false;
      return true;
    };

    const analysis = MutationFuzzer.evaluateMutationScore(validProduct, validator);
    Assert.greaterThan(analysis.totalMutants, 10, 'Should generate substantial mutant variations');
    Assert.greaterThan(analysis.killedCount, 0, 'Mutant validator should kill invalid variations');
    Assert.greaterThan(analysis.mutationScorePercentage, 30, 'Mutation score should exceed baseline threshold');
  });

  it('should handle transient faults and trip circuit breaker', async () => {
    const original = 'SECURE_API_AUTH_TOKEN_99482';
    const corrupted = ChaosFaultInjector.corruptString(original, 0.3);
    Assert.notEqual(corrupted, original, 'Corrupted string should differ from original');
    Assert.equal(corrupted.length, original.length, 'Length should remain unchanged');
 
    const breaker = new ChaosCircuitBreaker(3, 50);
    Assert.equal(breaker.getState(), 'CLOSED');

    let failCount = 0;
    const failingOp = async () => {
      failCount++;
      throw new Error('Connection refused');
    };

    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingOp);
      } catch {}
    }

    Assert.equal(breaker.getState(), 'OPEN');

    let fastFailed = false;
    try {
      await breaker.execute(failingOp);
    } catch (err: any) {
      fastFailed = err.message.includes('CircuitBreaker is OPEN');
    }
    Assert.isTrue(fastFailed, 'Circuit breaker should fast-fail when OPEN');
    Assert.equal(failCount, 3, 'Failing op should not have been called the 4th time');

    await new Promise((r) => setTimeout(r, 60));
    Assert.equal(breaker.getState(), 'HALF_OPEN');

    await breaker.execute(async () => 'recovered');
    Assert.equal(breaker.getState(), 'CLOSED');
  });
});
