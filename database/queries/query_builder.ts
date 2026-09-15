export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS' | 'FULL OUTER';

export interface JoinClause {
  type: JoinType;
  table: string;
  alias?: string;
  onCondition: string;
}

export interface WhereCondition {
  type: 'AND' | 'OR';
  clause: string;
  params: any[];
}

export interface WindowFunction {
  expression: string; // e.g. ROW_NUMBER(), DENSE_RANK(), SUM(amount)
  partitionBy?: string[];
  orderBy?: string[];
  alias: string;
}

export interface CTEClause {
  name: string;
  columns?: string[];
  query: string;
  recursive?: boolean;
}

export class QueryBuilder {
  private ctes: CTEClause[] = [];
  private selectedColumns: string[] = [];
  private fromTable: string = '';
  private fromAlias?: string;
  private joins: JoinClause[] = [];
  private whereConditions: WhereCondition[] = [];
  private groupBys: string[] = [];
  private havingConditions: string[] = [];
  private orderBys: string[] = [];
  private limitCount?: number;
  private offsetCount?: number;
  private isDistinct: boolean = false;
  private lockMode?: 'FOR UPDATE' | 'FOR SHARE';
  private indexHints: string[] = [];

  public static select(...columns: string[]): QueryBuilder {
    const qb = new QueryBuilder();
    return qb.select(...columns);
  }

  public static with(name: string, query: QueryBuilder | string, recursive: boolean = false): QueryBuilder {
    const qb = new QueryBuilder();
    return qb.with(name, query, recursive);
  }

  public with(name: string, query: QueryBuilder | string, recursive: boolean = false): this {
    const queryString = typeof query === 'string' ? query : query.toSQL().sql;
    this.ctes.push({ name, query: queryString, recursive });
    return this;
  }

  public select(...columns: string[]): this {
    if (columns.length === 0) {
      this.selectedColumns.push('*');
    } else {
      this.selectedColumns.push(...columns);
    }
    return this;
  }

  public selectDistinct(...columns: string[]): this {
    this.isDistinct = true;
    return this.select(...columns);
  }

  public selectWindow(windowFn: WindowFunction): this {
    let partClause = '';
    if (windowFn.partitionBy && windowFn.partitionBy.length > 0) {
      partClause = `PARTITION BY ${windowFn.partitionBy.join(', ')}`;
    }
    let orderClause = '';
    if (windowFn.orderBy && windowFn.orderBy.length > 0) {
      orderClause = `ORDER BY ${windowFn.orderBy.join(', ')}`;
    }

    const overBody = [partClause, orderClause].filter(Boolean).join(' ');
    this.selectedColumns.push(`${windowFn.expression} OVER (${overBody}) AS ${windowFn.alias}`);
    return this;
  }

  public from(table: string, alias?: string): this {
    this.fromTable = table;
    this.fromAlias = alias;
    return this;
  }

  public join(table: string, onCondition: string, type: JoinType = 'INNER', alias?: string): this {
    this.joins.push({ table, onCondition, type, alias });
    return this;
  }

  public leftJoin(table: string, onCondition: string, alias?: string): this {
    return this.join(table, onCondition, 'LEFT', alias);
  }

  public innerJoin(table: string, onCondition: string, alias?: string): this {
    return this.join(table, onCondition, 'INNER', alias);
  }

  public useIndex(...indexNames: string[]): this {
    this.indexHints.push(...indexNames);
    return this;
  }

  public where(clause: string, ...params: any[]): this {
    this.whereConditions.push({ type: 'AND', clause, params });
    return this;
  }

  public orWhere(clause: string, ...params: any[]): this {
    this.whereConditions.push({ type: 'OR', clause, params });
    return this;
  }

  public whereIn(field: string, values: any[]): this {
    if (values.length === 0) {
      return this.where('1 = 0');
    }
    const placeholders = values.map(() => '?').join(', ');
    return this.where(`${field} IN (${placeholders})`, ...values);
  }

  public groupBy(...columns: string[]): this {
    this.groupBys.push(...columns);
    return this;
  }

  public having(condition: string): this {
    this.havingConditions.push(condition);
    return this;
  }

  public orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderBys.push(`${field} ${direction}`);
    return this;
  }

  public limit(limit: number): this {
    this.limitCount = limit;
    return this;
  }

  public offset(offset: number): this {
    this.offsetCount = offset;
    return this;
  }

  public forUpdate(): this {
    this.lockMode = 'FOR UPDATE';
    return this;
  }

  public toSQL(): { sql: string; params: any[] } {
    const parts: string[] = [];
    const allParams: any[] = [];

    // 1. CTEs
    if (this.ctes.length > 0) {
      const isRecursive = this.ctes.some((c) => c.recursive);
      const cteDefs = this.ctes.map((c) => `${c.name} AS (${c.query})`).join(',\n  ');
      parts.push(`WITH ${isRecursive ? 'RECURSIVE ' : ''}\n  ${cteDefs}`);
    }

    // 2. SELECT
    const distinctStr = this.isDistinct ? 'DISTINCT ' : '';
    const cols = this.selectedColumns.length > 0 ? this.selectedColumns.join(', ') : '*';
    parts.push(`SELECT ${distinctStr}${cols}`);

    // 3. FROM & Index Hints
    if (this.fromTable) {
      let fromStr = `FROM ${this.fromTable}`;
      if (this.fromAlias) fromStr += ` AS ${this.fromAlias}`;
      if (this.indexHints.length > 0) {
        fromStr += ` USE INDEX (${this.indexHints.join(', ')})`;
      }
      parts.push(fromStr);
    }

    // 4. JOINs
    for (const j of this.joins) {
      let jStr = `${j.type} JOIN ${j.table}`;
      if (j.alias) jStr += ` AS ${j.alias}`;
      jStr += ` ON ${j.onCondition}`;
      parts.push(jStr);
    }

    // 5. WHERE
    if (this.whereConditions.length > 0) {
      let whereStr = 'WHERE ';
      for (let i = 0; i < this.whereConditions.length; i++) {
        const cond = this.whereConditions[i];
        if (i > 0) {
          whereStr += ` ${cond.type} `;
        }
        whereStr += `(${cond.clause})`;
        allParams.push(...cond.params);
      }
      parts.push(whereStr);
    }

    // 6. GROUP BY & HAVING
    if (this.groupBys.length > 0) {
      parts.push(`GROUP BY ${this.groupBys.join(', ')}`);
    }
    if (this.havingConditions.length > 0) {
      parts.push(`HAVING ${this.havingConditions.join(' AND ')}`);
    }

    // 7. ORDER BY
    if (this.orderBys.length > 0) {
      parts.push(`ORDER BY ${this.orderBys.join(', ')}`);
    }

    // 8. LIMIT & OFFSET
    if (this.limitCount !== undefined) {
      parts.push(`LIMIT ${this.limitCount}`);
    }
    if (this.offsetCount !== undefined) {
      parts.push(`OFFSET ${this.offsetCount}`);
    }

    // 9. Locking
    if (this.lockMode) {
      parts.push(this.lockMode);
    }

    return {
      sql: parts.join('\n'),
      params: allParams,
    };
  }
}
