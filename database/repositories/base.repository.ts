import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
}

export interface QueryFilter {
  field: string;
  operator: 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'ILIKE' | 'IN' | 'NOT_IN' | 'IS_NULL' | 'IS_NOT_NULL';
  value?: any;
}

export interface SortOption {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface FindOptions<T> {
  where?: QueryFilter[] | Record<string, any>;
  sort?: SortOption[];
  pagination?: PaginationOptions;
  select?: (keyof T | string)[];
  forUpdate?: boolean;
}

export abstract class BaseRepository<T extends { id: string }> {
  protected tableName: string;
  protected db: MigrationDatabaseAdapter;

  constructor(tableName: string, db: MigrationDatabaseAdapter) {
    this.tableName = tableName;
    this.db = db;
  }

  public getTableName(): string {
    return this.tableName;
  }

  public async findById(id: string, options?: { forUpdate?: boolean }): Promise<T | null> {
    let sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    if (options?.forUpdate) {
      sql += ' FOR UPDATE';
    }
    const rows = await this.db.query<T>(sql, [id]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  public async findOne(filters: QueryFilter[] | Record<string, any>): Promise<T | null> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const sql = `SELECT * FROM ${this.tableName} ${whereClause} LIMIT 1`;
    const rows = await this.db.query<T>(sql, params);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  public async findAll(options: FindOptions<T> = {}): Promise<PaginatedResult<T>> {
    const page = Math.max(1, options.pagination?.page || 1);
    const limit = Math.min(100, Math.max(1, options.pagination?.limit || 20));
    const offset = (page - 1) * limit;

    const { whereClause, params } = this.buildWhereClause(options.where);

    // Count query
    const countSql = `SELECT COUNT(*) as total_count FROM ${this.tableName} ${whereClause}`;
    const countRes = await this.db.query<{ total_count: number }>(countSql, params);
    const total = Number(countRes[0]?.total_count || 0);

    // Sort clause
    let sortClause = '';
    if (options.sort && options.sort.length > 0) {
      const parts = options.sort.map((s) => `${s.field} ${s.direction}`);
      sortClause = `ORDER BY ${parts.join(', ')}`;
    } else {
      sortClause = 'ORDER BY created_at DESC';
    }

    // Projection
    const selectCols = options.select && options.select.length > 0 ? options.select.join(', ') : '*';

    // Data query
    let dataSql = `SELECT ${selectCols} FROM ${this.tableName} ${whereClause} ${sortClause} LIMIT ? OFFSET ?`;
    if (options.forUpdate) {
      dataSql += ' FOR UPDATE';
    }

    const dataParams = [...params, limit, offset];
    const rawRows = await this.db.query<T>(dataSql, dataParams);
    const data = rawRows.map((r) => this.mapRow(r));
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  public async create(entity: Partial<T>): Promise<T> {
    const clean = this.unmapEntity(entity);
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => clean[k]);

    const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    await this.db.execute(sql, values);

    const inserted = await this.findById(entity.id!);
    if (!inserted) {
      throw new Error(`Failed to retrieve newly created entity with ID: ${entity.id}`);
    }
    return inserted;
  }

  public async update(id: string, updates: Partial<T>): Promise<T> {
    const clean = this.unmapEntity(updates);
    delete clean.id; // Never update primary key
    clean.updated_at = new Date().toISOString();

    const keys = Object.keys(clean);
    if (keys.length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error(`Entity with ID ${id} not found.`);
      return existing;
    }

    const setClauses = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...keys.map((k) => clean[k]), id];

    const sql = `UPDATE ${this.tableName} SET ${setClauses} WHERE id = ?`;
    const res = await this.db.execute(sql, values);
    if (res.rowsAffected === 0) {
      throw new Error(`Entity with ID ${id} not found or no changes made.`);
    }

    const updated = await this.findById(id);
    return updated!;
  }

  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const res = await this.db.execute(sql, [id]);
    return res.rowsAffected > 0;
  }

  public async softDelete(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = `UPDATE ${this.tableName} SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`;
    const res = await this.db.execute(sql, [now, now, id]);
    return res.rowsAffected > 0;
  }

  public async exists(id: string): Promise<boolean> {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const rows = await this.db.query(sql, [id]);
    return rows.length > 0;
  }

  protected buildWhereClause(filters?: QueryFilter[] | Record<string, any>): { whereClause: string; params: any[] } {
    if (!filters) {
      return { whereClause: '', params: [] };
    }

    const params: any[] = [];
    const clauses: string[] = [];

    if (Array.isArray(filters)) {
      for (const f of filters) {
        switch (f.operator) {
          case 'EQ':
            clauses.push(`${f.field} = ?`);
            params.push(f.value);
            break;
          case 'NEQ':
            clauses.push(`${f.field} != ?`);
            params.push(f.value);
            break;
          case 'GT':
            clauses.push(`${f.field} > ?`);
            params.push(f.value);
            break;
          case 'GTE':
            clauses.push(`${f.field} >= ?`);
            params.push(f.value);
            break;
          case 'LT':
            clauses.push(`${f.field} < ?`);
            params.push(f.value);
            break;
          case 'LTE':
            clauses.push(`${f.field} <= ?`);
            params.push(f.value);
            break;
          case 'LIKE':
            clauses.push(`${f.field} LIKE ?`);
            params.push(f.value);
            break;
          case 'ILIKE':
            clauses.push(`LOWER(${f.field}) LIKE LOWER(?)`);
            params.push(f.value);
            break;
          case 'IN':
            if (Array.isArray(f.value) && f.value.length > 0) {
              const inPlaceholders = f.value.map(() => '?').join(', ');
              clauses.push(`${f.field} IN (${inPlaceholders})`);
              params.push(...f.value);
            }
            break;
          case 'NOT_IN':
            if (Array.isArray(f.value) && f.value.length > 0) {
              const notInPlaceholders = f.value.map(() => '?').join(', ');
              clauses.push(`${f.field} NOT IN (${notInPlaceholders})`);
              params.push(...f.value);
            }
            break;
          case 'IS_NULL':
            clauses.push(`${f.field} IS NULL`);
            break;
          case 'IS_NOT_NULL':
            clauses.push(`${f.field} IS NOT NULL`);
            break;
        }
      }
    } else {
      for (const [key, val] of Object.entries(filters)) {
        if (val === null || val === undefined) {
          clauses.push(`${key} IS NULL`);
        } else {
          clauses.push(`${key} = ?`);
          params.push(val);
        }
      }
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { whereClause, params };
  }

  protected mapRow(row: any): T {
    const item = { ...row };
    // Parse JSON fields automatically if stored as string
    for (const key of Object.keys(item)) {
      if (typeof item[key] === 'string') {
        if ((item[key].startsWith('{') && item[key].endsWith('}')) || (item[key].startsWith('[') && item[key].endsWith(']'))) {
          try {
            item[key] = JSON.parse(item[key]);
          } catch {
            // Keep as string if parsing fails
          }
        }
      }
      if (item[key] === 1 && (key.startsWith('is_') || key.endsWith('_enabled') || key.endsWith('_verified'))) {
        item[key] = true;
      } else if (item[key] === 0 && (key.startsWith('is_') || key.endsWith('_enabled') || key.endsWith('_verified'))) {
        item[key] = false;
      }
    }
    return item as T;
  }

  protected unmapEntity(entity: any): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(entity)) {
      if (v === undefined) continue;
      if (typeof v === 'boolean') {
        out[k] = v ? 1 : 0;
      } else if (typeof v === 'object' && v !== null && !(v instanceof Date)) {
        out[k] = JSON.stringify(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
}
