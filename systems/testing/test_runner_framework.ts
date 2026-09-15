export type TestFn = () => Promise<void> | void;

export interface TestCase {
  suiteName: string;
  testName: string;
  fn: TestFn;
}

export interface TestResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export class TestRunner {
  private static tests: TestCase[] = [];
  private static currentSuite: string = 'Default';

  public static describe(suiteName: string, suiteFn: () => void): void {
    const prevSuite = this.currentSuite;
    this.currentSuite = suiteName;
    try {
      suiteFn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  public static it(testName: string, fn: TestFn): void {
    this.tests.push({
      suiteName: this.currentSuite,
      testName,
      fn,
    });
  }

  public static async runAll(): Promise<{ total: number; passed: number; failed: number; durationMs: number; results: TestResult[] }> {
    console.log(`\n========================================================`);
    console.log(`  ShopSphere Member 3 Test Suite Runner`);
    console.log(`========================================================\n`);

    const results: TestResult[] = [];
    let passedCount = 0;
    let failedCount = 0;
    const startAll = Date.now();

    let lastSuite = '';

    for (const t of this.tests) {
      if (t.suiteName !== lastSuite) {
        lastSuite = t.suiteName;
        console.log(`\n▶ ${t.suiteName}`);
      }

      const start = performance.now();
      try {
        await t.fn();
        const duration = Math.round((performance.now() - start) * 100) / 100;
        passedCount++;
        results.push({
          suiteName: t.suiteName,
          testName: t.testName,
          passed: true,
          durationMs: duration,
        });
        console.log(`  ✓ ${t.testName} (${duration}ms)`);
      } catch (err: any) {
        const duration = Math.round((performance.now() - start) * 100) / 100;
        failedCount++;
        results.push({
          suiteName: t.suiteName,
          testName: t.testName,
          passed: false,
          durationMs: duration,
          error: err,
        });
        console.error(`  ✗ ${t.testName} (${duration}ms)`);
        console.error(`    Error: ${err.message}`);
        if (err.stack) {
          const stackLine = err.stack.split('\n')[1] || '';
          console.error(`    ${stackLine.trim()}`);
        }
      }
    }

    const totalDuration = Date.now() - startAll;
    console.log(`\n--------------------------------------------------------`);
    console.log(`Test Execution Summary:`);
    console.log(`  Total:     ${this.tests.length}`);
    console.log(`  Passed:    ${passedCount}`);
    console.log(`  Failed:    ${failedCount}`);
    console.log(`  Duration:  ${totalDuration}ms`);

    if (failedCount > 0) {
      console.log(`\nFailed Tests:`);
      for (const r of results) {
        if (!r.passed) {
          console.log(`  - [${r.suiteName}] ${r.testName}`);
          console.log(`    Error: ${r.error?.message}`);
        }
      }
    }
    console.log(`--------------------------------------------------------\n`);

    if (failedCount > 0) {
      throw new Error(`${failedCount} tests failed out of ${this.tests.length} total tests.`);
    }

    return {
      total: this.tests.length,
      passed: passedCount,
      failed: failedCount,
      durationMs: totalDuration,
      results,
    };
  }

  public static clear(): void {
    this.tests = [];
  }
}

export const describe = TestRunner.describe.bind(TestRunner);
export const it = TestRunner.it.bind(TestRunner);
