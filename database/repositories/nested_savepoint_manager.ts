/**
 * ShopSphere Database Layer - Nested Transaction Savepoint Manager
 * Manages savepoint stacks inside active database transactions:
 * - Creates named savepoints: SAVEPOINT sp_xxx
 * - Partial rollbacks: ROLLBACK TO SAVEPOINT sp_xxx
 * - Releases savepoints: RELEASE SAVEPOINT sp_xxx
 */

export interface SavepointScope {
  id: string;
  name: string;
  createdAt: number;
  isReleased: boolean;
  isRolledBack: boolean;
}

export class NestedSavepointManager {
  private savepointStack: SavepointScope[] = [];
  private dbAdapter: any;

  constructor(dbAdapter: any) {
    this.dbAdapter = dbAdapter;
  }

  /**
   * Creates a new nested savepoint
   */
  public async createSavepoint(prefix: string = 'sp'): Promise<string> {
    const spName = `${prefix}_${this.savepointStack.length + 1}_${Math.random().toString(36).substring(2, 7)}`;
    await this.dbAdapter.execute(`SAVEPOINT ${spName};`);
    this.savepointStack.push({
      id: spName,
      name: spName,
      createdAt: Date.now(),
      isReleased: false,
      isRolledBack: false,
    });
    return spName;
  }

  /**
   * Rolls back the transaction to the specified savepoint
   */
  public async rollbackToSavepoint(spName: string): Promise<void> {
    const idx = this.savepointStack.findIndex((s) => s.name === spName);
    if (idx === -1) {
      throw new Error(`Savepoint '${spName}' not found in active transaction stack.`);
    }

    await this.dbAdapter.execute(`ROLLBACK TO SAVEPOINT ${spName};`);
    // Invalidate savepoints created after this one
    for (let i = idx; i < this.savepointStack.length; i++) {
      this.savepointStack[i].isRolledBack = true;
    }
    this.savepointStack = this.savepointStack.slice(0, idx);
  }

  /**
   * Releases the specified savepoint
   */
  public async releaseSavepoint(spName: string): Promise<void> {
    const idx = this.savepointStack.findIndex((s) => s.name === spName);
    if (idx === -1) return;

    await this.dbAdapter.execute(`RELEASE SAVEPOINT ${spName};`);
    this.savepointStack[idx].isReleased = true;
    this.savepointStack.splice(idx, 1);
  }

  /**
   * Executes a callback within a savepoint scope, rolling back on inner error without failing outer tx
   */
  public async withinSavepoint<T>(fn: () => Promise<T>, prefix: string = 'nested'): Promise<T> {
    const spName = await this.createSavepoint(prefix);
    try {
      const result = await fn();
      await this.releaseSavepoint(spName);
      return result;
    } catch (err) {
      await this.rollbackToSavepoint(spName);
      throw err;
    }
  }

  public getDepth(): number {
    return this.savepointStack.length;
  }
}
