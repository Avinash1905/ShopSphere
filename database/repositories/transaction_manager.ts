import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export type IsolationLevel = 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  timeoutMs?: number;
  readOnly?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class TransactionManager {
  private db: MigrationDatabaseAdapter;
  private inTransaction: boolean = false;
  private savepointStack: string[] = [];

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async runInTransaction<R>(
    work: (txDb: MigrationDatabaseAdapter) => Promise<R>,
    options: TransactionOptions = {}
  ): Promise<R> {
    const maxRetries = options.maxRetries || 1;
    const retryDelay = options.retryDelayMs || 50;

    let attempt = 0;
    while (attempt < maxRetries) {
      attempt++;
      try {
        if (!this.inTransaction) {
          await this.begin(options.isolationLevel);
          try {
            const result = await work(this.db);
            await this.commit();
            return result;
          } catch (err) {
            await this.rollback();
            throw err;
          }
        } else {
          // Nested transaction using Savepoints
          const spName = `sp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await this.createSavepoint(spName);
          try {
            const result = await work(this.db);
            await this.releaseSavepoint(spName);
            return result;
          } catch (err) {
            await this.rollbackSavepoint(spName);
            throw err;
          }
        }
      } catch (err: any) {
        const isDeadlockOrConflict =
          err?.message?.includes('deadlock') ||
          err?.message?.includes('busy') ||
          err?.message?.includes('conflict') ||
          err?.message?.includes('lock');

        if (attempt < maxRetries && isDeadlockOrConflict) {
          console.warn(`[TransactionManager] Conflict detected on attempt ${attempt}. Retrying in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)));
          continue;
        }
        throw err;
      }
    }

    throw new Error('Transaction failed after maximum retry attempts');
  }

  public async begin(isolationLevel?: IsolationLevel): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction is already active on this connection');
    }
    if (isolationLevel) {
      try {
        await this.db.execute(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      } catch {
        // Fallback for DB dialects that don't support dynamic isolation level config
      }
    }
    await this.db.beginTransaction();
    this.inTransaction = true;
    this.savepointStack = [];
  }

  public async commit(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('Cannot commit when no transaction is active');
    }
    await this.db.commitTransaction();
    this.inTransaction = false;
    this.savepointStack = [];
  }

  public async rollback(): Promise<void> {
    if (!this.inTransaction) {
      return;
    }
    await this.db.rollbackTransaction();
    this.inTransaction = false;
    this.savepointStack = [];
  }

  public async createSavepoint(name: string): Promise<void> {
    await this.db.execute(`SAVEPOINT ${name};`);
    this.savepointStack.push(name);
  }

  public async releaseSavepoint(name: string): Promise<void> {
    const idx = this.savepointStack.lastIndexOf(name);
    if (idx !== -1) {
      this.savepointStack.splice(idx, 1);
      await this.db.execute(`RELEASE SAVEPOINT ${name};`);
    }
  }

  public async rollbackSavepoint(name: string): Promise<void> {
    const idx = this.savepointStack.lastIndexOf(name);
    if (idx !== -1) {
      this.savepointStack.splice(idx);
      await this.db.execute(`ROLLBACK TO SAVEPOINT ${name};`);
    }
  }

  public isActive(): boolean {
    return this.inTransaction;
  }
}
