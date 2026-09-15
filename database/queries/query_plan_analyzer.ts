/**
 * ShopSphere Database Layer - Query Plan Cost Analyzer & Optimizer
 * Evaluates SQL queries to estimate execution bottlenecks:
 * - Detects Unindexed Sequential Table Scans on large tables
 * - Detects Cartesian products (missing JOIN conditions)
 * - Identifies non-SARGable predicates (e.g. UPPER(name) = 'FOO' preventing index use)
 * - Calculates estimated relative query cost score
 */

export interface QueryPlanIssue {
  type: 'UNINDEXED_SEQ_SCAN' | 'CARTESIAN_PRODUCT' | 'NON_SARGABLE_PREDICATE' | 'SELECT_STAR_OVERHEAD';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendation: string;
}

export interface QueryPlanAnalysis {
  sql: string;
  estimatedCostScore: number;
  isOptimal: boolean;
  issues: QueryPlanIssue[];
}

export class QueryPlanAnalyzer {
  public static analyze(sql: string): QueryPlanAnalysis {
    const issues: QueryPlanIssue[] = [];
    let costScore = 10;
    const upper = sql.toUpperCase();

    // 1. Check SELECT *
    if (upper.includes('SELECT *') || upper.includes('SELECT\n*')) {
      issues.push({
        type: 'SELECT_STAR_OVERHEAD',
        severity: 'LOW',
        description: 'SELECT * fetches unnecessary columns over the wire and prevents covering index scans.',
        recommendation: 'Explicitly specify required column projections.',
      });
      costScore += 15;
    }

    // 2. Check Cartesian products
    if (upper.includes('FROM ') && upper.includes(',') && !upper.includes(' JOIN ') && !upper.includes('WHERE ')) {
      issues.push({
        type: 'CARTESIAN_PRODUCT',
        severity: 'HIGH',
        description: 'Multiple tables listed in FROM clause without JOIN or WHERE predicate generates an $O(N \\times M)$ Cartesian product.',
        recommendation: 'Use explicit INNER JOIN or LEFT JOIN with ON condition.',
      });
      costScore += 500;
    }

    // 3. Check non-SARGable predicates (e.g. functions wrapping columns in WHERE)
    const nonSargableRegex = /WHERE\s+.*\b(LOWER|UPPER|SUBSTRING|DATE|COALESCE)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/i;
    if (nonSargableRegex.test(sql)) {
      issues.push({
        type: 'NON_SARGABLE_PREDICATE',
        severity: 'MEDIUM',
        description: 'Function call wraps indexed column in WHERE clause, which prevents B-Tree index seek and forces full table scan.',
        recommendation: 'Rewrite predicate to match raw column value or create an expression index.',
      });
      costScore += 80;
    }

    // 4. Check leading wildcard LIKE
    if (/LIKE\s+'%[^']+'/i.test(sql)) {
      issues.push({
        type: 'UNINDEXED_SEQ_SCAN',
        severity: 'HIGH',
        description: "Leading wildcard pattern (LIKE '%foo') cannot utilize standard B-Tree indexes.",
        recommendation: 'Use Trigram GIN index (pg_trgm) or dedicated Full-Text Search inverted index.',
      });
      costScore += 120;
    }

    return {
      sql,
      estimatedCostScore: costScore,
      isOptimal: issues.length === 0,
      issues,
    };
  }
}
