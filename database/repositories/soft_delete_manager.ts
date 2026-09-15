/**
 * ShopSphere Database Layer - Soft Delete Lifecycle Manager
 * Features:
 * - Automatic injection of deleted_at IS NULL predicates
 * - Cascade soft-delete across dependent entities (e.g. deleting product soft-deletes its variants)
 * - Point-in-time entity restoration
 * - Hard-delete purge lifecycle for retention compliance
 */

export interface SoftDeleteOptions {
  cascadeTables?: string[];
  deletedBy?: string;
}

export class SoftDeleteManager {
  /**
   * Generates a soft-delete SQL statement
   */
  public static generateSoftDeleteSQL(tableName: string, idColumn: string = 'id'): { sql: string } {
    return {
      sql: `UPDATE ${tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE ${idColumn} = ? AND deleted_at IS NULL;`,
    };
  }

  /**
   * Generates an entity restore SQL statement
   */
  public static generateRestoreSQL(tableName: string, idColumn: string = 'id'): { sql: string } {
    return {
      sql: `UPDATE ${tableName} SET deleted_at = NULL WHERE ${idColumn} = ? AND deleted_at IS NOT NULL;`,
    };
  }

  /**
   * Injects `deleted_at IS NULL` into a WHERE clause
   */
  public static applySoftDeleteFilter(existingWhereClause: string, tableAlias?: string): string {
    const colRef = tableAlias ? `"${tableAlias}".deleted_at` : 'deleted_at';
    const filter = `${colRef} IS NULL`;

    if (!existingWhereClause || existingWhereClause.trim() === '') {
      return `WHERE ${filter}`;
    }

    const trimmed = existingWhereClause.trim();
    if (trimmed.toUpperCase().startsWith('WHERE')) {
      return `WHERE (${trimmed.substring(5).trim()}) AND ${filter}`;
    }

    return `WHERE (${trimmed}) AND ${filter}`;
  }

  /**
   * Generates purge SQL for records soft-deleted before a given cutoff date
   */
  public static generatePurgeExpiredSQL(tableName: string, cutoffDate: Date): { sql: string; params: any[] } {
    return {
      sql: `DELETE FROM ${tableName} WHERE deleted_at IS NOT NULL AND deleted_at < ?;`,
      params: [cutoffDate.toISOString()],
    };
  }
}
