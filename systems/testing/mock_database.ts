import { MigrationDatabaseAdapter } from '../../database/migrations/runner.js';

export interface MockTableState {
  columns: string[];
  rows: Record<string, any>[];
}

export class MockDatabaseAdapter implements MigrationDatabaseAdapter {
  private tables: Map<string, Record<string, any>[]> = new Map();
  private inTransaction: boolean = false;
  private transactionSnapshot?: Map<string, string>;
  private savepoints: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.tables = new Map();
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');

    // 1. Check for single-table SELECT or joined SELECT
    const fromMatch = /FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?(?!WHERE\b|INNER\b|LEFT\b|RIGHT\b|JOIN\b|GROUP\b|ORDER\b|LIMIT\b|FOR\b)([a-zA-Z0-9_]+))?/i.exec(cleanSql);
    if (!fromMatch) {
      return [];
    }

    const mainTableName = fromMatch[1].toLowerCase();
    const mainAlias = fromMatch[2] ? fromMatch[2].toLowerCase() : mainTableName;

    // Build base dataset (handling JOINs if present)
    let rows: Record<string, any>[] = (this.tables.get(mainTableName) || []).map((r) => {
      const copy: Record<string, any> = { ...r };
      for (const [k, v] of Object.entries(r)) {
        copy[`${mainAlias}.${k}`] = v;
      }
      return copy;
    });

    // Handle INNER / LEFT JOINs
    const joinRegex = /(?:LEFT|INNER|RIGHT)?\s*JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)/gi;
    let joinMatch: RegExpExecArray | null;

    while ((joinMatch = joinRegex.exec(cleanSql)) !== null) {
      const joinTable = joinMatch[1].toLowerCase();
      const joinAlias = joinMatch[2] ? joinMatch[2].toLowerCase() : joinTable;
      const leftCol = joinMatch[3];
      const rightCol = joinMatch[4];
      const joinRows = this.tables.get(joinTable) || [];

      const joined: Record<string, any>[] = [];

      for (const baseRow of rows) {
        let matched = false;
        for (const jRow of joinRows) {
          const leftVal = this.resolveFieldValue(baseRow, leftCol);
          const rightVal = this.resolveFieldValue(jRow, rightCol) ?? this.resolveFieldValue(baseRow, rightCol);
          const altLeftVal = this.resolveFieldValue(jRow, leftCol);
          const altRightVal = this.resolveFieldValue(baseRow, rightCol);

          if (
            (leftVal !== undefined && rightVal !== undefined && leftVal === rightVal) ||
            (altLeftVal !== undefined && altRightVal !== undefined && altLeftVal === altRightVal)
          ) {
            matched = true;
            const combined: Record<string, any> = { ...baseRow, ...jRow };
            for (const [k, v] of Object.entries(jRow)) {
              combined[`${joinAlias}.${k}`] = v;
            }
            for (const [k, v] of Object.entries(baseRow)) {
              combined[`${mainAlias}.${k}`] = v;
            }
            joined.push(combined);
          }
        }

        if (!matched && /LEFT\s+JOIN/i.test(joinMatch[0])) {
          joined.push({ ...baseRow });
        }
      }

      rows = joined;
    }

    // 2. Extract WHERE clause and filter rows
    const whereMatch = /\s+WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|\s+FOR\s+UPDATE|$)/i.exec(cleanSql);
    const paramCursor = { current: 0 };

    if (whereMatch) {
      const whereClause = whereMatch[1];
      rows = this.filterRows(rows, whereClause, params, () => params[paramCursor.current++]);
    }

    // 3. Check for GROUP BY and Aggregations
    const groupByMatch = /\s+GROUP\s+BY\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+FOR\s+UPDATE|$)/i.exec(cleanSql);
    const selectPartMatch = /SELECT\s+(.+?)\s+FROM/i.exec(cleanSql);
    const selectPart = selectPartMatch ? selectPartMatch[1] : '*';

    if (groupByMatch) {
      const groupCols = groupByMatch[1].split(',').map((c) => c.trim());
      const groups = new Map<string, Record<string, any>[]>();

      for (const row of rows) {
        const key = groupCols.map((c) => String(this.resolveFieldValue(row, c))).join(':::');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }

      const groupedResult: Record<string, any>[] = [];
      for (const [, gRows] of groups.entries()) {
        groupedResult.push(this.projectRow(gRows, selectPart));
      }
      rows = groupedResult;
    } else if (
      /COUNT\s*\(/i.test(selectPart) ||
      /SUM\s*\(/i.test(selectPart) ||
      /AVG\s*\(/i.test(selectPart) ||
      /MAX\s*\(/i.test(selectPart)
    ) {
      // Global aggregation across all filtered rows
      return [this.projectRow(rows, selectPart)] as unknown as T[];
    }

    // 4. ORDER BY
    const orderMatch = /\s+ORDER\s+BY\s+(.+?)(?:\s+LIMIT|\s+FOR\s+UPDATE|$)/i.exec(cleanSql);
    if (orderMatch) {
      const sortParts = orderMatch[1].split(',').map((s) => s.trim());
      rows.sort((a, b) => {
        for (const part of sortParts) {
          const [field, direction] = part.split(/\s+/);
          const isDesc = direction ? direction.toUpperCase() === 'DESC' : false;
          const aVal = this.resolveFieldValue(a, field);
          const bVal = this.resolveFieldValue(b, field);

          if (aVal !== bVal) {
            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return isDesc ? bVal - aVal : aVal - bVal;
            }
            return isDesc ? String(bVal).localeCompare(String(aVal)) : String(aVal).localeCompare(String(bVal));
          }
        }
        return 0;
      });
    }

    // 5. LIMIT and OFFSET
    const limitOffsetMatch = /\s+LIMIT\s+(\?|\d+)(?:\s+OFFSET\s+(\?|\d+))?/i.exec(cleanSql);
    if (limitOffsetMatch) {
      let limitVal = 100;
      let offsetVal = 0;

      if (limitOffsetMatch[1] === '?') {
        limitVal = Number(params[paramCursor.current++]);
      } else {
        limitVal = parseInt(limitOffsetMatch[1], 10);
      }

      if (limitOffsetMatch[2]) {
        if (limitOffsetMatch[2] === '?') {
          offsetVal = Number(params[paramCursor.current++]);
        } else {
          offsetVal = parseInt(limitOffsetMatch[2], 10);
        }
      }

      rows = rows.slice(offsetVal, offsetVal + limitVal);
    }

    // 6. Project non-grouped columns if not '*'
    if (!groupByMatch && selectPart !== '*' && !selectPart.includes('*')) {
      rows = rows.map((r) => this.projectRow([r], selectPart));
    }

    return rows as T[];
  }

  public async execute(sql: string, params: any[] = []): Promise<{ rowsAffected: number }> {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');

    // 1. CREATE TABLE
    const createTableMatch = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i.exec(cleanSql);
    if (createTableMatch) {
      const tableName = createTableMatch[1].toLowerCase();
      if (!this.tables.has(tableName)) {
        this.tables.set(tableName, []);
      }
      return { rowsAffected: 0 };
    }

    // 2. DROP TABLE
    const dropTableMatch = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i.exec(cleanSql);
    if (dropTableMatch) {
      const tableName = dropTableMatch[1].toLowerCase();
      this.tables.delete(tableName);
      return { rowsAffected: 0 };
    }

    // 3. CREATE INDEX / DROP INDEX (no-op in memory)
    if (/CREATE\s+(?:UNIQUE\s+)?INDEX/i.test(cleanSql) || /DROP\s+INDEX/i.test(cleanSql)) {
      return { rowsAffected: 0 };
    }

    // 4. INSERT INTO
    const insertMatch = /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+([a-zA-Z0-9_]+)\s*\((.+?)\)\s*VALUES\s*\((.+)\)/i.exec(cleanSql);
    if (insertMatch) {
      const tableName = insertMatch[1].toLowerCase();
      const colNames = insertMatch[2].split(',').map((c) => c.trim());
      const valuesClause = insertMatch[3];
      const paramCursor = { current: 0 };
      const parsedValues = this.parseValuesList(valuesClause, params, paramCursor);

      let tableRows = this.tables.get(tableName);
      if (!tableRows) {
        tableRows = [];
        this.tables.set(tableName, tableRows);
      }

      const row: Record<string, any> = {};
      for (let i = 0; i < colNames.length; i++) {
        row[colNames[i]] = parsedValues[i];
      }

      // Check primary key uniqueness
      if (row.id && tableRows.some((r) => r.id === row.id)) {
        if (/INSERT\s+OR\s+IGNORE/i.test(cleanSql)) {
          return { rowsAffected: 0 };
        }
        throw new Error(`Unique constraint violation: duplicate primary key '${row.id}' in table '${tableName}'`);
      }

      tableRows.push(row);
      return { rowsAffected: 1 };
    }

    // 5. UPDATE
    const updateMatch = /UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i.exec(cleanSql);
    if (updateMatch) {
      const tableName = updateMatch[1].toLowerCase();
      const setPart = updateMatch[2];
      const wherePart = updateMatch[3] || '';
      const tableRows = this.tables.get(tableName) || [];

      const paramCursor = { current: 0 };
      const assignments = this.parseSetClauses(setPart, params, paramCursor);

      // Filter rows based on WHERE clause using remaining params
      let matchedRows = tableRows;
      if (wherePart) {
        matchedRows = this.filterRows(tableRows, wherePart, params, () => params[paramCursor.current++]);
      }

      for (const row of matchedRows) {
        for (const assign of assignments) {
          if (assign.isExpression && assign.expr) {
            if (assign.expr.includes('+')) {
              const [cName, addVal] = assign.expr.split('+').map((s) => s.trim());
              row[assign.col] = (Number(row[cName]) || 0) + (Number(addVal) || 0);
            } else if (assign.expr.includes('-')) {
              const [cName, subVal] = assign.expr.split('-').map((s) => s.trim());
              row[assign.col] = (Number(row[cName]) || 0) - (Number(subVal) || 0);
            }
          } else {
            row[assign.col] = assign.val;
          }
        }
      }

      return { rowsAffected: matchedRows.length };
    }

    // 6. DELETE
    const deleteMatch = /DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i.exec(cleanSql);
    if (deleteMatch) {
      const tableName = deleteMatch[1].toLowerCase();
      const wherePart = deleteMatch[2];
      let tableRows = this.tables.get(tableName) || [];
      const initialCount = tableRows.length;

      if (wherePart) {
        const paramCursor = { current: 0 };
        const matchingRows = new Set(this.filterRows(tableRows, wherePart, params, () => params[paramCursor.current++]));
        tableRows = tableRows.filter((r) => !matchingRows.has(r));
        this.tables.set(tableName, tableRows);
      } else {
        this.tables.set(tableName, []);
      }

      return { rowsAffected: initialCount - tableRows.length };
    }

    return { rowsAffected: 0 };
  }

  public async beginTransaction(): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction already active');
    }
    this.inTransaction = true;
    this.transactionSnapshot = this.snapshotState();
  }

  public async commitTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction active to commit');
    }
    this.inTransaction = false;
    this.transactionSnapshot = undefined;
    this.savepoints.clear();
  }

  public async rollbackTransaction(): Promise<void> {
    if (!this.inTransaction) return;
    if (this.transactionSnapshot) {
      this.restoreState(this.transactionSnapshot);
    }
    this.inTransaction = false;
    this.transactionSnapshot = undefined;
    this.savepoints.clear();
  }

  public async createSavepoint(name: string): Promise<void> {
    this.savepoints.set(name, this.snapshotState());
  }

  public async rollbackSavepoint(name: string): Promise<void> {
    const snap = this.savepoints.get(name);
    if (snap) {
      this.restoreState(snap);
    }
  }

  public clearAllTables(): void {
    this.tables.clear();
  }

  public getAllTableNames(): string[] {
    return Array.from(this.tables.keys());
  }

  public getRawTableData(tableName: string): Record<string, any>[] {
    return this.tables.get(tableName.toLowerCase()) || [];
  }

  public setRawTableData(tableName: string, rows: Record<string, any>[]): void {
    this.tables.set(tableName.toLowerCase(), rows);
  }

  private parseValuesList(valuesClause: string, params: any[], paramCursor: { current: number }): any[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0;

    for (let i = 0; i < valuesClause.length; i++) {
      const ch = valuesClause[i];
      if (inQuotes) {
        current += ch;
        if (ch === quoteChar) {
          inQuotes = false;
        }
      } else if (ch === "'" || ch === '"') {
        inQuotes = true;
        quoteChar = ch;
        current += ch;
      } else if (ch === '(') {
        parenDepth++;
        current += ch;
      } else if (ch === ')') {
        parenDepth--;
        current += ch;
      } else if (ch === ',' && parenDepth === 0) {
        tokens.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim().length > 0) {
      tokens.push(current.trim());
    }

    return tokens.map((tok) => {
      if (tok === '?') {
        return params[paramCursor.current++];
      }
      if (/^CURRENT_TIMESTAMP$/i.test(tok) || /^NOW\(\)$/i.test(tok)) {
        return new Date().toISOString();
      }
      const dateMatch = /^datetime\(\s*['"]now['"]\s*,\s*['"]([+-]?\d+)\s*days?['"]\s*\)$/i.exec(tok);
      if (dateMatch) {
        const days = parseInt(dateMatch[1], 10);
        return new Date(Date.now() + days * 86400000).toISOString();
      }
      if (/^TRUE$/i.test(tok)) return 1;
      if (/^FALSE$/i.test(tok)) return 0;
      if (/^NULL$/i.test(tok)) return null;
      if (/^'([^']*)'$/.test(tok)) return /^'([^']*)'$/.exec(tok)![1];
      if (/^\d+(?:\.\d+)?$/.test(tok)) return Number(tok);
      return tok;
    });
  }

  private parseSetClauses(
    setClause: string,
    params: any[],
    paramCursor: { current: number }
  ): { col: string; isExpression: boolean; val?: any; expr?: string }[] {
    const clauses: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0;

    for (let i = 0; i < setClause.length; i++) {
      const ch = setClause[i];
      if (inQuotes) {
        current += ch;
        if (ch === quoteChar) inQuotes = false;
      } else if (ch === "'" || ch === '"') {
        inQuotes = true;
        quoteChar = ch;
        current += ch;
      } else if (ch === '(') {
        parenDepth++;
        current += ch;
      } else if (ch === ')') {
        parenDepth--;
        current += ch;
      } else if (ch === ',' && parenDepth === 0) {
        clauses.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim().length > 0) clauses.push(current.trim());

    return clauses.map((c) => {
      const eqIdx = c.indexOf('=');
      const col = c.substring(0, eqIdx).trim();
      const rhs = c.substring(eqIdx + 1).trim();

      if (rhs === '?') {
        return { col, isExpression: false, val: params[paramCursor.current++] };
      }
      if (/^CURRENT_TIMESTAMP$/i.test(rhs) || /^NOW\(\)$/i.test(rhs)) {
        return { col, isExpression: false, val: new Date().toISOString() };
      }
      if (/^NULL$/i.test(rhs)) {
        return { col, isExpression: false, val: null };
      }
      if (/^\d+(?:\.\d+)?$/.test(rhs)) {
        return { col, isExpression: false, val: Number(rhs) };
      }
      if (rhs.includes('+') || rhs.includes('-')) {
        return { col, isExpression: true, expr: rhs };
      }
      return { col, isExpression: false, val: rhs.replace(/['"]/g, '') };
    });
  }

  private filterRows(
    rows: Record<string, any>[],
    whereClause: string,
    params: any[],
    nextParam: () => any
  ): Record<string, any>[] {
    // Split by top-level AND
    const conditions = whereClause.split(/\s+AND\s+/i);

    let filtered = [...rows];

    for (const cond of conditions) {
      const trimmed = cond.trim();

      // 1. IS NULL
      const isNullMatch = /^(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s+IS\s+NULL$/i.exec(trimmed);
      if (isNullMatch) {
        const col = isNullMatch[1];
        filtered = filtered.filter((r) => this.resolveFieldValue(r, col) === null || this.resolveFieldValue(r, col) === undefined);
        continue;
      }

      // 2. IS NOT NULL
      const isNotNullMatch = /^(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s+IS\s+NOT\s+NULL$/i.exec(trimmed);
      if (isNotNullMatch) {
        const col = isNotNullMatch[1];
        filtered = filtered.filter((r) => this.resolveFieldValue(r, col) !== null && this.resolveFieldValue(r, col) !== undefined);
        continue;
      }

      // 3. IN / NOT IN with literals or params
      const inMatch = /^(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s+(NOT\s+IN|IN)\s*\((.+?)\)$/i.exec(trimmed);
      if (inMatch) {
        const col = inMatch[1];
        const isNegated = inMatch[2].toUpperCase().includes('NOT');
        const inItems = inMatch[3].split(',').map((s) => s.trim().replace(/['"]/g, ''));
        const targetValues = inItems.map((item) => (item === '?' ? nextParam() : item));

        filtered = filtered.filter((r) => {
          const val = String(this.resolveFieldValue(r, col));
          const has = targetValues.map(String).includes(val);
          return isNegated ? !has : has;
        });
        continue;
      }

      // 4. LIKE / ILIKE
      const likeMatch = /^(?:LOWER\((?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\)\s+LIKE\s+LOWER\((.+?)\)|(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s+LIKE\s+(.+))$/i.exec(trimmed);
      if (likeMatch) {
        const col = likeMatch[1] || likeMatch[3];
        const rhs = (likeMatch[2] || likeMatch[4]).trim();
        const patternVal = rhs === '?' ? nextParam() : rhs.replace(/['"]/g, '');
        const regexStr = '^' + String(patternVal).replace(/%/g, '.*').replace(/_/g, '.') + '$';
        const reg = new RegExp(regexStr, 'i');

        filtered = filtered.filter((r) => {
          const val = this.resolveFieldValue(r, col);
          return val !== undefined && reg.test(String(val));
        });
        continue;
      }

      // 5. datetime comparison
      const datetimeMatch = /^(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s*(>=|>|<=|<)\s*datetime\(\s*['"]now['"]\s*,\s*['"]([+-]?\d+)\s*days?['"]\s*\)$/i.exec(trimmed);
      if (datetimeMatch) {
        const col = datetimeMatch[1];
        const op = datetimeMatch[2];
        const days = parseInt(datetimeMatch[3], 10);
        const cutoff = Date.now() + days * 86400000;

        filtered = filtered.filter((r) => {
          const val = this.resolveFieldValue(r, col);
          if (!val) return false;
          const ts = new Date(val).getTime();
          if (op === '>=') return ts >= cutoff;
          if (op === '>') return ts > cutoff;
          if (op === '<=') return ts <= cutoff;
          return ts < cutoff;
        });
        continue;
      }

      // 6. Binary Operators: =, !=, <>, >, >=, <, <=
      const opMatch = /^(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/i.exec(trimmed);
      if (opMatch) {
        const col = opMatch[1];
        const op = opMatch[2] === '<>' ? '!=' : opMatch[2];
        const rhs = opMatch[3].trim();
        const expectedVal = rhs === '?' ? nextParam() : rhs.replace(/['"]/g, '');

        filtered = filtered.filter((r) => {
          const rowVal = this.resolveFieldValue(r, col);
          if (op === '=') {
            if (typeof expectedVal === 'boolean' || typeof rowVal === 'boolean') {
              const b1 = rowVal === 1 || rowVal === true || rowVal === 'true';
              const b2 = expectedVal === 1 || expectedVal === true || expectedVal === 'true';
              return b1 === b2;
            }
            if (expectedVal === 'TRUE' || expectedVal === 'true') {
              return rowVal === 1 || rowVal === true || rowVal === 'true';
            }
            if (expectedVal === 'FALSE' || expectedVal === 'false') {
              return rowVal === 0 || rowVal === false || rowVal === 'false';
            }
            return String(rowVal) === String(expectedVal) || rowVal === expectedVal;
          }
          if (op === '!=') {
            return String(rowVal) !== String(expectedVal) && rowVal !== expectedVal;
          }
          if (op === '>') {
            return Number(rowVal) > Number(expectedVal);
          }
          if (op === '>=') {
            if (typeof rowVal === 'string' && typeof expectedVal === 'string') {
              return rowVal >= expectedVal;
            }
            return Number(rowVal) >= Number(expectedVal);
          }
          if (op === '<') {
            return Number(rowVal) < Number(expectedVal);
          }
          if (op === '<=') {
            if (typeof rowVal === 'string' && typeof expectedVal === 'string') {
              return rowVal <= expectedVal;
            }
            return Number(rowVal) <= Number(expectedVal);
          }
          return true;
        });
      }
    }

    return filtered;
  }

  private resolveFieldValue(row: Record<string, any>, colExpr: string): any {
    if (!row) return undefined;
    const cleanCol = colExpr.trim();

    // Exact match (e.g. 'p.title' or 'title')
    if (row[cleanCol] !== undefined) return row[cleanCol];

    // Strip alias prefix (e.g. 'p.title' -> 'title')
    if (cleanCol.includes('.')) {
      const field = cleanCol.split('.')[1];
      if (row[field] !== undefined) return row[field];
    }

    // Function wrappers e.g. DATE(created_at) -> created_at
    const funcMatch = /^[A-Z]+\((.+?)\)$/i.exec(cleanCol);
    if (funcMatch) {
      const inner = funcMatch[1].trim();
      const val = this.resolveFieldValue(row, inner);
      if (cleanCol.toUpperCase().startsWith('DATE(') && typeof val === 'string') {
        return val.substring(0, 10);
      }
      return val;
    }

    return undefined;
  }

  private projectRow(groupRows: Record<string, any>[], selectPart: string): Record<string, any> {
    if (groupRows.length === 0) return {};
    const firstRow = groupRows[0];
    const out: Record<string, any> = {};

    const selectItems = selectPart.split(',').map((s) => s.trim());

    for (const item of selectItems) {
      // 1. Alias match: expr AS alias
      const asMatch = /(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i.exec(item);
      const expr = asMatch ? asMatch[1].trim() : item;
      const alias = asMatch ? asMatch[2].trim() : expr.includes('.') ? expr.split('.')[1] : expr;

      // 2. Aggregate functions
      if (/^COUNT\s*\(\s*DISTINCT\s+(.+?)\s*\)$/i.test(expr)) {
        const distinctCol = /^COUNT\s*\(\s*DISTINCT\s+(.+?)\s*\)$/i.exec(expr)![1].trim();
        const set = new Set(groupRows.map((r) => this.resolveFieldValue(r, distinctCol)).filter((v) => v !== undefined));
        out[alias] = set.size;
      } else if (/^COUNT\s*\(\s*(\*|[a-zA-Z0-9_.]+)\s*\)$/i.test(expr)) {
        out[alias] = groupRows.length;
      } else if (/^SUM\s*\((.+?)\)$/i.test(expr)) {
        const sumExpr = /^SUM\s*\((.+?)\)$/i.exec(expr)![1].trim();
        let sum = 0;
        for (const r of groupRows) {
          if (sumExpr.includes('*')) {
            const [c1, c2] = sumExpr.split('*').map((s) => s.trim());
            const v1 = Number(this.resolveFieldValue(r, c1) || 0);
            const v2 = Number(this.resolveFieldValue(r, c2) || 0);
            sum += v1 * v2;
          } else {
            sum += Number(this.resolveFieldValue(r, sumExpr) || 0);
          }
        }
        out[alias] = Math.round(sum * 100) / 100;
      } else if (/^AVG\s*\((.+?)\)$/i.test(expr)) {
        const avgCol = /^AVG\s*\((.+?)\)$/i.exec(expr)![1].trim();
        const vals = groupRows.map((r) => Number(this.resolveFieldValue(r, avgCol) || 0));
        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        out[alias] = Math.round(avg * 100) / 100;
      } else {
        // Plain column or expression
        out[alias] = this.resolveFieldValue(firstRow, expr);
      }
    }

    return out;
  }

  private snapshotState(): Map<string, string> {
    const snap = new Map<string, string>();
    for (const [tName, rows] of this.tables.entries()) {
      snap.set(tName, JSON.stringify(rows));
    }
    return snap;
  }

  private restoreState(snapshot: Map<string, string>): void {
    this.tables.clear();
    for (const [tName, jsonStr] of snapshot.entries()) {
      this.tables.set(tName, JSON.parse(jsonStr));
    }
  }
}
