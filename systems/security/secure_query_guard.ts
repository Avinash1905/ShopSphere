export class SecureQueryGuard {
  private static readonly FORBIDDEN_SQLI_PATTERNS = [
    /;\s*DROP\s+TABLE/i,
    /;\s*ALTER\s+TABLE/i,
    /;\s*TRUNCATE/i,
    /;\s*EXEC/i,
    /UNION\s+(?:ALL\s+)?SELECT/i,
    /OR\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
    /--/m,
    /\/\*[\s\S]*?\*\//,
    /BENCHMARK\s*\(/i,
    /PG_SLEEP\s*\(/i,
    /SLEEP\s*\(/i,
    /xp_cmdshell/i,
  ];

  /**
   * Inspects SQL query strings for unescaped, malicious SQL injection bypass syntax
   */
  public static inspectQuerySafety(sql: string, params: any[] = []): { isSafe: boolean; violation?: string } {
    for (const pattern of this.FORBIDDEN_SQLI_PATTERNS) {
      if (pattern.test(sql)) {
        return {
          isSafe: false,
          violation: `SQL contains forbidden pattern matching ${pattern.source}`,
        };
      }
    }

    // Ensure parameters count matches placeholders if '?' exists
    const placeholderCount = (sql.match(/\?/g) || []).length;
    if (placeholderCount !== params.length) {
      return {
        isSafe: false,
        violation: `Query placeholder count (${placeholderCount}) does not match supplied parameter count (${params.length})`,
      };
    }

    return { isSafe: true };
  }
}
