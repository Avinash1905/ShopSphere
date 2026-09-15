/**
 * ShopSphere Database Layer - High-Throughput Bulk Operations Engine
 * Features:
 * - Chunked batch insertion (e.g. 10,000 records partitioned into 500-item chunks)
 * - Bulk upsert: INSERT INTO ... ON CONFLICT (id) DO UPDATE SET ...
 * - Parameterized batch generation
 */

export interface BulkInsertOptions {
  chunkSize?: number;
  onConflict?: 'DO_NOTHING' | 'DO_UPDATE';
  conflictKeys?: string[];
  updateColumns?: string[];
}

export class BulkOperationsEngine {
  /**
   * Partitions an array into chunks
   */
  public static chunkArray<T>(items: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Generates a multi-row INSERT SQL query with parameter bindings
   */
  public static generateBulkInsertSQL(
    tableName: string,
    records: Record<string, any>[],
    options: BulkInsertOptions = {}
  ): { sql: string; params: any[] } {
    if (records.length === 0) {
      return { sql: '', params: [] };
    }

    const columns = Object.keys(records[0]);
    const valuesPlaceholders: string[] = [];
    const params: any[] = [];

    for (const record of records) {
      const rowPlaceholders: string[] = [];
      for (const col of columns) {
        rowPlaceholders.push('?');
        params.push(record[col] !== undefined ? record[col] : null);
      }
      valuesPlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    let sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES \n${valuesPlaceholders.join(',\n')}`;

    if (options.onConflict === 'DO_NOTHING' && options.conflictKeys) {
      sql += `\nON CONFLICT (${options.conflictKeys.join(', ')}) DO NOTHING`;
    } else if (options.onConflict === 'DO_UPDATE' && options.conflictKeys && options.updateColumns) {
      const updateClauses = options.updateColumns.map((col) => `${col} = EXCLUDED.${col}`);
      sql += `\nON CONFLICT (${options.conflictKeys.join(', ')}) DO UPDATE SET ${updateClauses.join(', ')}`;
    }

    sql += ';';
    return { sql, params };
  }

  /**
   * Executes chunked bulk insert using database adapter
   */
  public static async executeBulkInsert(
    dbAdapter: any,
    tableName: string,
    records: Record<string, any>[],
    options: BulkInsertOptions = {}
  ): Promise<{ totalInserted: number; chunksExecuted: number }> {
    const chunkSize = options.chunkSize || 250;
    const chunks = this.chunkArray(records, chunkSize);
    let totalInserted = 0;

    for (const chunk of chunks) {
      const { sql, params } = this.generateBulkInsertSQL(tableName, chunk, options);
      if (sql) {
        await dbAdapter.execute(sql, params);
        totalInserted += chunk.length;
      }
    }

    return {
      totalInserted,
      chunksExecuted: chunks.length,
    };
  }
}
