export interface PRNG {
  next(): number;
  nextInt(min: number, max: number): number;
}

export class SeededPRNG implements PRNG {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  public next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    const r = this.next();
    return Math.floor(r * (max - min + 1)) + min;
  }
}

export interface Arbitrary<T> {
  generate(prng: PRNG, size: number): T;
  shrink(value: T): Iterable<T>;
}

export class Arbitraries {
  public static integer(min: number = -1000, max: number = 1000): Arbitrary<number> {
    return {
      generate(prng: PRNG): number {
        return prng.nextInt(min, max);
      },
      *shrink(value: number): Iterable<number> {
        if (value === 0) return;
        if (0 >= min && 0 <= max) yield 0;
        let diff = Math.floor(value / 2);
        while (diff !== 0) {
          const candidate = value - diff;
          if (candidate >= min && candidate <= max) {
            yield candidate;
          }
          diff = Math.floor(diff / 2);
        }
      },
    };
  }

  public static float(min: number = 0.0, max: number = 1000.0, precision: number = 2): Arbitrary<number> {
    const factor = Math.pow(10, precision);
    return {
      generate(prng: PRNG): number {
        const raw = min + prng.next() * (max - min);
        return Math.round(raw * factor) / factor;
      },
      *shrink(value: number): Iterable<number> {
        if (value === 0) return;
        if (0 >= min && 0 <= max) yield 0;
        const halved = Math.round((value / 2) * factor) / factor;
        if (halved >= min && halved <= max && halved !== value) {
          yield halved;
        }
      },
    };
  }

  public static string(options: { minLen?: number; maxLen?: number; charset?: string } = {}): Arbitrary<string> {
    const minLen = options.minLen ?? 0;
    const maxLen = options.maxLen ?? 20;
    const charset = options.charset ?? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-';

    return {
      generate(prng: PRNG): string {
        const len = prng.nextInt(minLen, maxLen);
        let res = '';
        for (let i = 0; i < len; i++) {
          const idx = prng.nextInt(0, charset.length - 1);
          res += charset[idx];
        }
        return res;
      },
      *shrink(value: string): Iterable<string> {
        if (value.length <= minLen) return;
        if (minLen === 0) yield '';
        yield value.slice(0, Math.floor(value.length / 2));
        yield value.slice(1);
        yield value.slice(0, value.length - 1);
      },
    };
  }

  public static email(): Arbitrary<string> {
    const nameArb = this.string({ minLen: 3, maxLen: 10, charset: 'abcdefghijklmnopqrstuvwxyz0123456789' });
    const domainArb = this.string({ minLen: 3, maxLen: 8, charset: 'abcdefghijklmnopqrstuvwxyz' });

    return {
      generate(prng: PRNG, size: number): string {
        const user = nameArb.generate(prng, size) || 'user';
        const domain = domainArb.generate(prng, size) || 'example';
        return user + '@' + domain + '.com';
      },
      *shrink(value: string): Iterable<string> {
        const parts = value.split('@');
        const user = parts[0];
        const host = parts[1];
        if (user && user.length > 3) {
          yield user.slice(0, -1) + '@' + host;
        }
      },
    };
  }

  public static array<T>(elementArb: Arbitrary<T>, minLen: number = 0, maxLen: number = 10): Arbitrary<T[]> {
    return {
      generate(prng: PRNG, size: number): T[] {
        const len = prng.nextInt(minLen, maxLen);
        const arr: T[] = [];
        for (let i = 0; i < len; i++) {
          arr.push(elementArb.generate(prng, size));
        }
        return arr;
      },
      *shrink(arr: T[]): Iterable<T[]> {
        if (arr.length <= minLen) return;
        if (minLen === 0) yield [];
        yield arr.slice(0, Math.floor(arr.length / 2));
        yield arr.slice(1);
        yield arr.slice(0, arr.length - 1);

        for (let i = 0; i < arr.length; i++) {
          for (const shrunkItem of elementArb.shrink(arr[i])) {
            const copy = [...arr];
            copy[i] = shrunkItem;
            yield copy;
          }
        }
      },
    };
  }

  public static record<T extends Record<string, any>>(spec: { [K in keyof T]: Arbitrary<T[K]> }): Arbitrary<T> {
    return {
      generate(prng: PRNG, size: number): T {
        const res: any = {};
        for (const [key, arb] of Object.entries(spec)) {
          res[key] = (arb as Arbitrary<any>).generate(prng, size);
        }
        return res as T;
      },
      *shrink(val: T): Iterable<T> {
        for (const [key, arb] of Object.entries(spec)) {
          for (const shrunkVal of (arb as Arbitrary<any>).shrink(val[key])) {
            yield { ...val, [key]: shrunkVal };
          }
        }
      },
    };
  }
}

export interface PropertyCheckResult<T> {
  passed: boolean;
  numRuns: number;
  failingExample?: T;
  shrunkExample?: T;
  shrinkSteps?: number;
  seed: number;
}

export class PropertyTestRunner {
  public static async forAll<T>(
    arbitrary: Arbitrary<T>,
    property: (val: T) => boolean | Promise<boolean>,
    options: { runs?: number; seed?: number; maxShrinkSteps?: number } = {}
  ): Promise<PropertyCheckResult<T>> {
    const runs = options.runs ?? 100;
    const seed = options.seed ?? Date.now();
    const maxShrinkSteps = options.maxShrinkSteps ?? 50;
    const prng = new SeededPRNG(seed);

    for (let run = 1; run <= runs; run++) {
      const generated = arbitrary.generate(prng, run);
      let holds = false;
      try {
        holds = await property(generated);
      } catch (err: any) {
        holds = false;
      }

      if (!holds) {
        let currentMinimal = generated;
        let shrinkSteps = 0;
        let improved = true;

        while (improved && shrinkSteps < maxShrinkSteps) {
          improved = false;
          for (const candidate of arbitrary.shrink(currentMinimal)) {
            shrinkSteps++;
            let candidateHolds = false;
            try {
              candidateHolds = await property(candidate);
            } catch {
              candidateHolds = false;
            }

            if (!candidateHolds) {
              currentMinimal = candidate;
              improved = true;
              break;
            }
          }
        }

        return {
          passed: false,
          numRuns: run,
          failingExample: generated,
          shrunkExample: currentMinimal,
          shrinkSteps,
          seed,
        };
      }
    }

    return {
      passed: true,
      numRuns: runs,
      seed,
    };
  }
}
