import { MockDatabaseAdapter } from './mock_database.js';
import { createDefaultMigrationRunner } from '../../database/migrations/index.js';
import { createDefaultSeedRunner } from '../../database/seeds/index.js';
import { UnitOfWork } from '../../database/repositories/unit_of_work.js';

export class FixturesLoader {
  public static async setupTestDatabase(): Promise<{ db: MockDatabaseAdapter; uow: UnitOfWork }> {
    const db = new MockDatabaseAdapter();

    // 1. Run migrations
    const migrationRunner = createDefaultMigrationRunner(db);
    await migrationRunner.up();

    // 2. Populate deterministic seed dataset
    const seedRunner = createDefaultSeedRunner(db, 1337);
    await seedRunner.runAll();

    // 3. Initialize UnitOfWork
    const uow = new UnitOfWork(db);

    return { db, uow };
  }
}
