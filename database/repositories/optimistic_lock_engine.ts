/**
 * ShopSphere Database Repositories - Optimistic Lock Engine
 * Implements version-checked atomic mutations with exponential backoff and conflict resolution
 */

import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class OptimisticLockException extends Error {
  public readonly tableName: string;
  public readonly entityId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;

  constructor(tableName: string, entityId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Optimistic lock collision on table '${tableName}' for entity '${entityId}': ` +
      `expected version ${expectedVersion}, found version ${actualVersion}`
    );
    this.name = 'OptimisticLockException';
    this.tableName = tableName;
    this.entityId = entityId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

export interface OptimisticLockOptions {
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  versionColumn?: string;
}

export class OptimisticLockEngine {
  /**
   * Executes an atomic mutation with optimistic version checking and automated retry loop
   */
  public static async executeWithLock<T extends { id: string; version: number }>(
    db: MigrationDatabaseAdapter,
    tableName: string,
    entityId: string,
    mutationFn: (current: T) => Promise<Partial<T>>,
    options: OptimisticLockOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 5;
    const initialBackoff = options.initialBackoffMs ?? 10;
    const maxBackoff = options.maxBackoffMs ?? 200;
    const versionCol = options.versionColumn ?? 'version';

    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;

      // 1. Fetch current state
      const rows = await db.query<T>(`SELECT * FROM ${tableName} WHERE id = ?`, [entityId]);
      if (rows.length === 0) {
        throw new Error(`Entity '${entityId}' not found in table '${tableName}'`);
      }
      const current = rows[0];
      const currentVersion = Number(current.version || 1);

      // 2. Compute new state
      const updates = await mutationFn(current);
      const newVersion = currentVersion + 1;

      // 3. Prepare update statement with WHERE version = currentVersion
      const clean: Record<string, any> = { ...updates, [versionCol]: newVersion, updated_at: new Date().toISOString() };
      delete clean.id;

      const setClauses = Object.keys(clean).map(k => `${k} = ?`).join(', ');
      const sql = `UPDATE ${tableName} SET ${setClauses} WHERE id = ? AND ${versionCol} = ?`;
      const values = [...Object.values(clean), entityId, currentVersion];

      const res = await db.execute(sql, values);

      if (res.rowsAffected > 0) {
        // Success!
        const updatedRows = await db.query<T>(`SELECT * FROM ${tableName} WHERE id = ?`, [entityId]);
        return updatedRows[0];
      }

      // Conflict occurred
      if (attempt >= maxRetries) {
        const latest = await db.query<T>(`SELECT ${versionCol} FROM ${tableName} WHERE id = ?`, [entityId]);
        const actualVersion = Number(latest[0]?.version || 0);
        throw new OptimisticLockException(tableName, entityId, currentVersion, actualVersion);
      }

      // Backoff with jitter
      const backoff = Math.min(maxBackoff, initialBackoff * Math.pow(2, attempt - 1)) + Math.random() * 10;
      await new Promise(resolve => setTimeout(resolve, backoff));
    }

    throw new Error(`Exceeded maximum retries for optimistic lock on ${tableName}:${entityId}`);
  }
}
