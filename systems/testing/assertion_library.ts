export class AssertionError extends Error {
  public actual: any;
  public expected: any;

  constructor(message: string, actual?: any, expected?: any) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export class Assert {
  public static equal<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new AssertionError(
        message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
        actual,
        expected
      );
    }
  }

  public static notEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new AssertionError(
        message || `Expected values to be different, but both were ${JSON.stringify(actual)}`,
        actual,
        expected
      );
    }
  }

  public static deepEqual(actual: any, expected: any, message?: string): void {
    const sActual = JSON.stringify(actual);
    const sExpected = JSON.stringify(expected);
    if (sActual !== sExpected) {
      throw new AssertionError(
        message || `Deep equality assertion failed:\nActual:   ${sActual}\nExpected: ${sExpected}`,
        actual,
        expected
      );
    }
  }

  public static isTrue(value: boolean, message?: string): void {
    if (value !== true) {
      throw new AssertionError(message || `Expected true, but got ${value}`, value, true);
    }
  }

  public static isFalse(value: boolean, message?: string): void {
    if (value !== false) {
      throw new AssertionError(message || `Expected false, but got ${value}`, value, false);
    }
  }

  public static isNull(value: any, message?: string): void {
    if (value !== null && value !== undefined) {
      throw new AssertionError(message || `Expected null or undefined, but got ${value}`, value, null);
    }
  }

  public static isNotNull(value: any, message?: string): void {
    if (value === null || value === undefined) {
      throw new AssertionError(message || `Expected non-null value, but got ${value}`, value, 'not null');
    }
  }

  public static greaterThan(actual: number, threshold: number, message?: string): void {
    if (actual <= threshold) {
      throw new AssertionError(
        message || `Expected ${actual} to be strictly greater than ${threshold}`,
        actual,
        `> ${threshold}`
      );
    }
  }

  public static greaterThanOrEqual(actual: number, threshold: number, message?: string): void {
    if (actual < threshold) {
      throw new AssertionError(
        message || `Expected ${actual} to be greater than or equal to ${threshold}`,
        actual,
        `>= ${threshold}`
      );
    }
  }

  public static lessThan(actual: number, threshold: number, message?: string): void {
    if (actual >= threshold) {
      throw new AssertionError(
        message || `Expected ${actual} to be strictly less than ${threshold}`,
        actual,
        `< ${threshold}`
      );
    }
  }

  public static arrayContains<T>(array: T[], item: T, message?: string): void {
    if (!array.includes(item)) {
      throw new AssertionError(
        message || `Array does not contain expected item: ${JSON.stringify(item)}`,
        array,
        item
      );
    }
  }

  public static async throws(fn: () => Promise<any> | any, expectedErrorType?: any, message?: string): Promise<Error> {
    try {
      await fn();
    } catch (err: any) {
      if (expectedErrorType && !(err instanceof expectedErrorType)) {
        throw new AssertionError(
          `Thrown error was of type ${err.constructor.name}, expected ${expectedErrorType.name}`,
          err.constructor.name,
          expectedErrorType.name
        );
      }
      return err;
    }
    throw new AssertionError(message || 'Expected function to throw an error, but it succeeded without error.');
  }

  public static performanceWithin(durationMs: number, maxAllowedMs: number, message?: string): void {
    if (durationMs > maxAllowedMs) {
      throw new AssertionError(
        message || `Performance SLA breached: took ${durationMs}ms, maximum allowed is ${maxAllowedMs}ms`,
        durationMs,
        `<= ${maxAllowedMs}ms`
      );
    }
  }
}
