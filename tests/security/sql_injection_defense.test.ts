import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { SecurityFuzzer } from '../../systems/testing/security_fuzzer.js';
import { SecureQueryGuard } from '../../systems/security/secure_query_guard.js';

describe('Security: SQL Injection Defense & AST Guard Test', () => {
  it('should block 100% of malicious SQL injection fuzz payloads', () => {
    const report = SecurityFuzzer.runSQLIFuzzSuite();
    Assert.equal(report.bypassedCount, 0, 'Zero SQL injection payloads bypassed security guard');
    Assert.equal(report.blockedCount, report.totalPayloads, 'All SQL injection payloads blocked');
  });

  it('should verify parameter placeholder count matching', () => {
    const validSQL = 'SELECT * FROM users WHERE email = ? AND status = ?';
    const validGuard = SecureQueryGuard.inspectQuerySafety(validSQL, ['test@example.com', 'ACTIVE']);
    Assert.isTrue(validGuard.isSafe, 'Parameterized query with matching parameters passed');

    const mismatchedGuard = SecureQueryGuard.inspectQuerySafety(validSQL, ['test@example.com']);
    Assert.isFalse(mismatchedGuard.isSafe, 'Query with parameter count mismatch rejected');
  });
});
