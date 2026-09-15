import { InputSanitizer } from '../security/sanitizer.js';
import { SecureQueryGuard } from '../security/secure_query_guard.js';

export interface FuzzTestReport {
  totalPayloads: number;
  blockedCount: number;
  bypassedCount: number;
  vulnerabilities: { payload: string; type: string; details: string }[];
}

export class SecurityFuzzer {
  public static readonly XSS_PAYLOADS = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg/onload=alert(1)>',
    '"><script src=data:text/javascript,alert(1)></script>',
    'javascript:/*--></title></style></textarea></script></xmp><svg/onload=\'+/"/+/onmouseover=1/+/[*/[]/+alert(1)//\'>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<body onload=alert(1)>',
    '<input type="image" src=x onerror=alert(1)>',
  ];

  public static readonly SQLI_PAYLOADS = [
    "' OR '1'='1",
    "admin' --",
    "1; DROP TABLE users; --",
    "' UNION SELECT null, email, password_hash FROM users --",
    "1' AND SLEEP(5) --",
    "1' OR 1=1; DROP TABLE products; --",
    "'; EXEC xp_cmdshell('dir'); --",
  ];

  public static readonly PATH_TRAVERSAL_PAYLOADS = [
    '../../../../etc/passwd',
    '..\\..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '../../../../.env\0.jpg',
  ];

  public static runXSSFuzzSuite(): FuzzTestReport {
    const vulnerabilities: { payload: string; type: string; details: string }[] = [];
    let blocked = 0;

    for (const payload of this.XSS_PAYLOADS) {
      const sanitized = InputSanitizer.sanitizeHTML(payload);
      if (sanitized.includes('<script') || sanitized.includes('onerror=') || sanitized.includes('onload=') || sanitized.includes('javascript:')) {
        vulnerabilities.push({
          payload,
          type: 'XSS_BYPASS',
          details: `Sanitized string still contains executable tokens: ${sanitized}`,
        });
      } else {
        blocked++;
      }
    }

    return {
      totalPayloads: this.XSS_PAYLOADS.length,
      blockedCount: blocked,
      bypassedCount: vulnerabilities.length,
      vulnerabilities,
    };
  }

  public static runSQLIFuzzSuite(): FuzzTestReport {
    const vulnerabilities: { payload: string; type: string; details: string }[] = [];
    let blocked = 0;

    for (const payload of this.SQLI_PAYLOADS) {
      const rawQuery = `SELECT * FROM users WHERE email = '${payload}'`;
      const safety = SecureQueryGuard.inspectQuerySafety(rawQuery, []);
      if (safety.isSafe) {
        vulnerabilities.push({
          payload,
          type: 'SQLI_GUARD_BYPASS',
          details: 'Dangerous unparameterized query passed safety inspection',
        });
      } else {
        blocked++;
      }
    }

    return {
      totalPayloads: this.SQLI_PAYLOADS.length,
      blockedCount: blocked,
      bypassedCount: vulnerabilities.length,
      vulnerabilities,
    };
  }
}
