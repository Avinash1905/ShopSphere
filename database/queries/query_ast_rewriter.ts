export interface ASTQueryNode {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  columns: string[];
  fromTable: string;
  joins: Array<{ type: string; table: string; on: string }>;
  whereClauses: string[];
  groupBy: string[];
  orderBy: string[];
  limit?: number;
  offset?: number;
  indexHints: string[];
}

export interface RewriterOptimizationRules {
  enforceTenantIsolation?: boolean;
  tenantId?: string;
  injectSoftDeleteFilter?: boolean;
  softDeleteColumn?: string;
  forceIndexNames?: string[];
  maxLimitCap?: number;
}

export interface RewriteResult {
  originalSQL: string;
  rewrittenSQL: string;
  injectedPredicates: string[];
  appliedRules: string[];
}

export class QueryASTRewriter {
  /**
   * Parses basic SQL into structured AST Node representation
   */
  public static parse(sql: string): ASTQueryNode {
    const cleaned = sql.trim().replace(/\s+/g, ' ');
    const selectMatch = cleaned.match(/^SELECT (.*?) FROM/i);
    const fromMatch = cleaned.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    const whereMatch = cleaned.match(/WHERE\s+(.*?)(?:\s+GROUP BY|\s+ORDER BY|\s+LIMIT|$)/i);
    const orderMatch = cleaned.match(/ORDER BY\s+(.*?)(?:\s+LIMIT|$)/i);
    const limitMatch = cleaned.match(/LIMIT\s+(\d+)/i);

    const columns = selectMatch ? selectMatch[1].split(',').map((s) => s.trim()) : ['*'];
    const fromTable = fromMatch ? fromMatch[1].trim() : '';
    const whereClauses = whereMatch ? [whereMatch[1].trim()] : [];
    const orderBy = orderMatch ? orderMatch[1].split(',').map((s) => s.trim()) : [];
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : undefined;

    return {
      type: 'SELECT',
      columns,
      fromTable,
      joins: [],
      whereClauses,
      groupBy: [],
      orderBy,
      limit,
      indexHints: [],
    };
  }

  /**
   * Rewrites an arbitrary SQL query to enforce multi-tenant isolation, soft-delete rules, and index hints
   */
  public static rewrite(sql: string, rules: RewriterOptimizationRules): RewriteResult {
    let currentSql = sql.trim();
    const appliedRules: string[] = [];
    const injectedPredicates: string[] = [];

    // 1. Enforce Multi-tenant isolation (inject tenant_id = 'xxx')
    if (rules.enforceTenantIsolation && rules.tenantId) {
      const tenantPredicate = `tenant_id = '${rules.tenantId.replace(/'/g, "''")}'`;
      if (/WHERE/i.test(currentSql)) {
        currentSql = currentSql.replace(/WHERE\s+/i, `WHERE ${tenantPredicate} AND `);
      } else if (/FROM\s+[a-zA-Z0-9_]+/i.test(currentSql)) {
        currentSql = currentSql.replace(/(FROM\s+[a-zA-Z0-9_]+)/i, `$1 WHERE ${tenantPredicate}`);
      }
      injectedPredicates.push(tenantPredicate);
      appliedRules.push('TENANT_ISOLATION_ENFORCED');
    }

    // 2. Inject Soft-delete filter
    if (rules.injectSoftDeleteFilter) {
      const col = rules.softDeleteColumn || 'deleted_at';
      const softDelPredicate = `${col} IS NULL`;
      if (/WHERE/i.test(currentSql)) {
        currentSql = currentSql.replace(/WHERE\s+/i, `WHERE ${softDelPredicate} AND `);
      } else if (/FROM\s+[a-zA-Z0-9_]+/i.test(currentSql)) {
        currentSql = currentSql.replace(/(FROM\s+[a-zA-Z0-9_]+)/i, `$1 WHERE ${softDelPredicate}`);
      }
      injectedPredicates.push(softDelPredicate);
      appliedRules.push('SOFT_DELETE_GUARD_INJECTED');
    }

    // 3. Inject Index Hints
    if (rules.forceIndexNames && rules.forceIndexNames.length > 0) {
      const hint = `FORCE INDEX (${rules.forceIndexNames.join(', ')})`;
      currentSql = currentSql.replace(/(FROM\s+[a-zA-Z0-9_]+)/i, `$1 ${hint}`);
      appliedRules.push('INDEX_HINT_INJECTED');
    }

    // 4. Cap Maximum Limit for safety against DOS memory exhaustion
    if (rules.maxLimitCap !== undefined) {
      const limitMatch = currentSql.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const val = parseInt(limitMatch[1], 10);
        if (val > rules.maxLimitCap) {
          currentSql = currentSql.replace(/LIMIT\s+\d+/i, `LIMIT ${rules.maxLimitCap}`);
          appliedRules.push(`LIMIT_CAPPED_TO_${rules.maxLimitCap}`);
        }
      } else {
        currentSql += ` LIMIT ${rules.maxLimitCap}`;
        appliedRules.push(`DEFAULT_LIMIT_APPENDED_${rules.maxLimitCap}`);
      }
    }

    return {
      originalSQL: sql,
      rewrittenSQL: currentSql,
      injectedPredicates,
      appliedRules,
    };
  }

  /**
   * Analyzes date range filter to determine optimal partition targets
   */
  public static extractPartitionPruningTargets(
    sql: string,
    partitionDateField: string = 'created_at'
  ): { prunable: boolean; targetPartitions: string[] } {
    const regex = new RegExp(`${partitionDateField}\\s*>=\\s*['"](\\d{4}-\\d{2}-\\d{2})['"]`, 'i');
    const match = sql.match(regex);

    if (match) {
      const dateStr = match[1];
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(5, 7);
      return {
        prunable: true,
        targetPartitions: [`p_${year}_${month}`, `p_${year}_future`],
      };
    }

    return {
      prunable: false,
      targetPartitions: [],
    };
  }
}
