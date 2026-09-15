/**
 * ShopSphere Database Layer - Partition Manager
 * Declarative table partitioning definitions (Range, List, Hash) for high-velocity datasets:
 * - audit_logs (Range partitioning by created_at monthly intervals)
 * - notifications (Range partitioning by created_at monthly intervals)
 * - order_items (Hash partitioning by order_id across 8 shards)
 */

export type PartitionStrategy = 'RANGE' | 'LIST' | 'HASH';

export interface PartitionBound {
  partitionName: string;
  fromValue?: string | number;
  toValue?: string | number;
  listValues?: Array<string | number>;
  modulus?: number;
  remainder?: number;
}

export interface PartitionTableConfig {
  tableName: string;
  strategy: PartitionStrategy;
  partitionColumn: string;
  partitions: PartitionBound[];
}

export class PartitionManager {
  private static configs: Map<string, PartitionTableConfig> = new Map([
    [
      'audit_logs',
      {
        tableName: 'audit_logs',
        strategy: 'RANGE',
        partitionColumn: 'created_at',
        partitions: [
          { partitionName: 'audit_logs_2026_q1', fromValue: '2026-01-01', toValue: '2026-04-01' },
          { partitionName: 'audit_logs_2026_q2', fromValue: '2026-04-01', toValue: '2026-07-01' },
          { partitionName: 'audit_logs_2026_q3', fromValue: '2026-07-01', toValue: '2026-10-01' },
          { partitionName: 'audit_logs_2026_q4', fromValue: '2026-10-01', toValue: '2027-01-01' },
        ],
      },
    ],
    [
      'notifications',
      {
        tableName: 'notifications',
        strategy: 'RANGE',
        partitionColumn: 'created_at',
        partitions: [
          { partitionName: 'notifications_2026_h1', fromValue: '2026-01-01', toValue: '2026-07-01' },
          { partitionName: 'notifications_2026_h2', fromValue: '2026-07-01', toValue: '2027-01-01' },
        ],
      },
    ],
  ]);

  public static getPartitionConfig(tableName: string): PartitionTableConfig | undefined {
    return this.configs.get(tableName);
  }

  public static getAllPartitionConfigs(): PartitionTableConfig[] {
    return Array.from(this.configs.values());
  }

  public static registerPartitionConfig(config: PartitionTableConfig): void {
    this.configs.set(config.tableName, config);
  }

  /**
   * Generates PostgreSQL native partition table DDL
   */
  public static generatePostgresPartitionDDL(config: PartitionTableConfig): string[] {
    const ddl: string[] = [];
    if (config.strategy === 'RANGE') {
      for (const p of config.partitions) {
        ddl.push(
          `CREATE TABLE IF NOT EXISTS "${p.partitionName}" PARTITION OF "${config.tableName}" FOR VALUES FROM ('${p.fromValue}') TO ('${p.toValue}');`
        );
      }
    } else if (config.strategy === 'HASH') {
      for (const p of config.partitions) {
        ddl.push(
          `CREATE TABLE IF NOT EXISTS "${p.partitionName}" PARTITION OF "${config.tableName}" FOR VALUES WITH (MODULUS ${p.modulus}, REMAINDER ${p.remainder});`
        );
      }
    }
    return ddl;
  }

  /**
   * Generates next quarter partition creation statement
   */
  public static generateFuturePartitionDDL(tableName: string, year: number, quarter: number): string {
    const qStart = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
    const nextQYear = quarter === 4 ? year + 1 : year;
    const nextQMonth = quarter === 4 ? 1 : quarter * 3 + 1;
    const qEnd = `${nextQYear}-${String(nextQMonth).padStart(2, '0')}-01`;
    const pName = `${tableName}_${year}_q${quarter}`;
    return `CREATE TABLE IF NOT EXISTS "${pName}" PARTITION OF "${tableName}" FOR VALUES FROM ('${qStart}') TO ('${qEnd}');`;
  }
}
