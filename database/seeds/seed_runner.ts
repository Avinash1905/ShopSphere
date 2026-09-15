import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface Seeder {
  name: string;
  order: number;
  run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }>;
}

/**
 * Deterministic Pseudo-Random Number Generator (PRNG) for reproducible seed data
 */
export class SeedPRNG {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  public next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public nextDecimal(min: number, max: number, decimals: number = 2): number {
    const val = this.next() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  }

  public choice<T>(array: T[]): T {
    if (array.length === 0) throw new Error('Cannot pick from empty array');
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }

  public sample<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => this.next() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  public nextUuid(): string {
    const hex = '0123456789abcdef';
    let uuid = '';
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-';
      } else if (i === 14) {
        uuid += '4';
      } else if (i === 19) {
        uuid += hex[(Math.floor(this.next() * 4) + 8)];
      } else {
        uuid += hex[Math.floor(this.next() * 16)];
      }
    }
    return uuid;
  }
}

export class SeedRunner {
  private seeders: Seeder[] = [];
  private db: MigrationDatabaseAdapter;
  private prng: SeedPRNG;

  constructor(db: MigrationDatabaseAdapter, prngSeed: number = 1337) {
    this.db = db;
    this.prng = new SeedPRNG(prngSeed);
  }

  public register(seeder: Seeder): void {
    this.seeders.push(seeder);
    this.seeders.sort((a, b) => a.order - b.order);
  }

  public async runAll(): Promise<{ totalSeeders: number; details: Record<string, number> }> {
    console.log('[Seeder] Starting database population pipeline...');
    const details: Record<string, number> = {};

    for (const seeder of this.seeders) {
      console.log(`[Seeder] Running seeder #${seeder.order}: ${seeder.name}...`);
      const startTime = Date.now();
      const res = await seeder.run(this.db, this.prng);
      const elapsed = Date.now() - startTime;
      details[res.entityName] = res.count;
      console.log(`[Seeder] ✓ Populated ${res.count} records for ${res.entityName} in ${elapsed}ms`);
    }

    console.log('[Seeder] ✓ Database seeding pipeline completed successfully!');
    return {
      totalSeeders: this.seeders.length,
      details,
    };
  }
}
