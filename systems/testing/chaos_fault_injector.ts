export interface ChaosPolicy {
  failureRate?: number;
  latencyMinMs?: number;
  latencyMaxMs?: number;
  timeoutThresholdMs?: number;
  errorFactory?: () => Error;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class ChaosCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private readonly failureThreshold: number;
  private readonly recoveryTimeoutMs: number;
  private lastFailureTime: number = 0;

  constructor(failureThreshold: number = 3, recoveryTimeoutMs: number = 1000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeoutMs = recoveryTimeoutMs;
  }

  public getState(): CircuitState {
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime > this.recoveryTimeoutMs) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  public recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();
    if (currentState === 'OPEN') {
      throw new Error('CircuitBreaker is OPEN: fast-failing request to protect downstream dependencies');
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }
}

export class ChaosFaultInjector {
  public static async injectLatency(minMs: number, maxMs: number): Promise<number> {
    if (maxMs <= 0) return 0;
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return delay;
  }

  public static corruptString(payload: string, corruptionRate: number = 0.2): string {
    const chars = payload.split('');
    const corruptCount = Math.max(1, Math.floor(chars.length * corruptionRate));
    for (let i = 0; i < corruptCount; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      chars[idx] = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
    }
    return chars.join('');
  }

  public static async executeWithChaos<T>(policy: ChaosPolicy, fn: () => Promise<T>): Promise<T> {
    if (policy.latencyMinMs !== undefined && policy.latencyMaxMs !== undefined) {
      await this.injectLatency(policy.latencyMinMs, policy.latencyMaxMs);
    }

    if (policy.failureRate && Math.random() < policy.failureRate) {
      if (policy.errorFactory) {
        throw policy.errorFactory();
      }
      throw new Error('ChaosFaultInjector: synthetic chaos transient failure injected');
    }

    if (policy.timeoutThresholdMs) {
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('ChaosFaultInjector: query timeout exceeded ' + policy.timeoutThresholdMs + 'ms'));
        }, policy.timeoutThresholdMs);
      });

      try {
        const result = await Promise.race([fn(), timeoutPromise]);
        clearTimeout(timer!);
        return result;
      } catch (err) {
        clearTimeout(timer!);
        throw err;
      }
    }

    return await fn();
  }
}
