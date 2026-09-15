import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { SecurityService } from '../../systems/security/security_service.js';
import { SecurityEventDispatcher, SecurityAlarmEvent } from '../../systems/security/security_events.js';
import { InputSanitizer } from '../../systems/security/sanitizer.js';
import { SecureQueryGuard } from '../../systems/security/secure_query_guard.js';

describe('E2E: Security Threat Mitigation Test', () => {
  it('should detect brute force, block attack payloads, dispatch security alarm, and apply penalty lockout', async () => {
    const security = new SecurityService();
    const attackerIp = '198.51.100.99';
    let capturedAlarm: SecurityAlarmEvent | null = null;

    // 1. Subscribe to security alarm dispatcher
    SecurityEventDispatcher.subscribe((event) => {
      capturedAlarm = event;
    });

    // 2. Simulate brute-force credential stuffing attempts
    for (let i = 0; i < 5; i++) {
      security.threatDetector.recordFailedAttempt(attackerIp);
    }

    // 3. Assess threat level
    const threatReport = security.threatDetector.assessThreat(attackerIp, 'sqlmap/1.6', "SELECT * FROM users WHERE 1=1; DROP TABLE products; --");
    Assert.greaterThanOrEqual(threatReport.threatScore, 70, 'Threat score marked high');
    Assert.isTrue(threatReport.isBlocked, 'Attacker flagged for block');

    // 4. Dispatch security event alarm
    await SecurityEventDispatcher.dispatch({
      eventType: 'BRUTE_FORCE_LOCKOUT',
      severity: 'HIGH',
      ipAddress: attackerIp,
      details: { detectedThreats: threatReport.detectedThreats, score: threatReport.threatScore },
    });

    Assert.isNotNull(capturedAlarm, 'Security alarm event dispatched');
    Assert.equal(capturedAlarm!.eventType, 'BRUTE_FORCE_LOCKOUT', 'Alarm type matches');

    // 5. Apply rate limit penalty block
    security.rateLimiter.applyPenaltyBlock(attackerIp, 15);
    const requestAttempt = security.rateLimiter.checkRequest(attackerIp);
    Assert.isFalse(requestAttempt.allowed, 'Requests from attacker IP strictly blocked');
    Assert.isTrue(requestAttempt.penaltyBlocked === true, 'Penalty block is active');

    // 6. Verify input sanitization & query guard block malicious payload
    const sanitizedInput = InputSanitizer.sanitizeHTML('<script>alert("PWNED")</script>');
    Assert.isFalse(sanitizedInput.includes('<script>'), 'Malicious script tag neutralized');

    const sqliGuard = SecureQueryGuard.inspectQuerySafety("SELECT * FROM users WHERE email = 'admin' OR 1=1; --");
    Assert.isFalse(sqliGuard.isSafe, 'Malicious SQL statement blocked');
  });
});
