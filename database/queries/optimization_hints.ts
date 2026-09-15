export interface QueryAnalysis {
  query: string;
  hasFullTableScanRisk: boolean;
  missingIndexSuggestions: string[];
  estimatedComplexityScore: number;
  recommendations: string[];
}

export class OptimizationAdvisor {
  public static analyzeQuery(sql: string): QueryAnalysis {
    const upperSQL = sql.toUpperCase();
    const suggestions: string[] = [];
    const recommendations: string[] = [];
    let hasScanRisk = false;
    let complexity = 1;

    // 1. Check for leading wildcards in LIKE
    if (upperSQL.includes("LIKE '%") || upperSQL.includes('LIKE "%')) {
      hasScanRisk = true;
      recommendations.push(
        'Leading wildcard detected in LIKE operator ("%..."). This forces a full table scan. Prefer inverted index or full-text trigram index.'
      );
    }

    // 2. Check for missing LIMIT in unbounded SELECT
    if (upperSQL.includes('SELECT') && !upperSQL.includes('LIMIT') && !upperSQL.includes('COUNT(')) {
      recommendations.push(
        'Query has no LIMIT clause. High result volume can cause buffer pool eviction and memory pressure. Add explicit pagination.'
      );
      complexity += 2;
    }

    // 3. Check for multiple JOINs
    const joinMatches = upperSQL.match(/JOIN/g);
    if (joinMatches && joinMatches.length > 3) {
      complexity += joinMatches.length * 2;
      recommendations.push(
        `Query contains ${joinMatches.length} JOIN operations. Ensure joined foreign keys have composite covering indexes.`
      );
    }

    // 4. Index suggestions based on table and WHERE
    if (upperSQL.includes('FROM PRODUCTS') && upperSQL.includes('CATEGORY_ID') && upperSQL.includes('STATUS')) {
      suggestions.push('idx_products_category_status (category_id, status)');
    }
    if (upperSQL.includes('FROM ORDERS') && upperSQL.includes('USER_ID') && upperSQL.includes('CREATED_AT')) {
      suggestions.push('idx_orders_user_created (user_id, created_at)');
    }
    if (upperSQL.includes('FROM AUDIT_LOGS') && upperSQL.includes('ENTITY_NAME') && upperSQL.includes('ENTITY_ID')) {
      suggestions.push('idx_audit_entity_lookup (entity_name, entity_id)');
    }

    return {
      query: sql,
      hasFullTableScanRisk: hasScanRisk,
      missingIndexSuggestions: suggestions,
      estimatedComplexityScore: complexity,
      recommendations,
    };
  }
}
