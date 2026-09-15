import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { InputSanitizer } from '../../systems/security/sanitizer.js';
import { SecurityRateLimiter } from '../../systems/security/rate_limiter.js';
import { AccessControlEngine } from '../../systems/security/rbac_abac_engine.js';
import { SessionSecurityMonitor } from '../../systems/security/session_monitor.js';
import { ThreatDetector } from '../../systems/security/threat_detector.js';
import { PIIProtector } from '../../systems/security/pii_protector.js';
import { SecureQueryGuard } from '../../systems/security/secure_query_guard.js';

describe('Security System Integration Test Suite', () => {
  it('should sanitize HTML, XSS payloads, and path traversal attempts', () => {
    const rawXSS = '<script>alert("XSS")</script><img src=x onerror=alert(1)>Hello World';
    const cleanHTML = InputSanitizer.sanitizeHTML(rawXSS);
    Assert.isFalse(cleanHTML.includes('<script>'), 'Script tags removed');
    Assert.isFalse(cleanHTML.includes('onerror='), 'Event handlers stripped');
    Assert.isTrue(cleanHTML.includes('Hello World'), 'Safe content preserved');

    const pathAttack = '../../../../etc/passwd';
    const cleanPath = InputSanitizer.sanitizeFilePath(pathAttack);
    Assert.isFalse(cleanPath.includes('..'), 'Path traversal dots stripped');
  });

  it('should mask sensitive PII and secrets in logs and entity snapshots', () => {
    const sensitivePayload = {
      user_id: 'usr-123',
      email: 'alex.morgan@example.com',
      phone_number: '+1-555-0199',
      card_number: '4111222233334444',
      password_hash: '$2b$12$e8e9r8...',
      salt: 'salt123',
    };

    const masked = PIIProtector.sanitizeSensitiveData(sensitivePayload);
    Assert.equal(masked.password_hash, '[REDACTED_SECRET]', 'Password hash redacted');
    Assert.equal(masked.salt, '[REDACTED_SECRET]', 'Salt redacted');
    Assert.isTrue(masked.card_number.includes('**** 4444'), 'Credit card masked');
    Assert.isTrue(masked.email.includes('a***n@example.com'), 'Email masked');
  });

  it('should enforce rate limits with token bucket and penalty blocks', () => {
    const rateLimiter = new SecurityRateLimiter();
    const testIp = '198.51.100.45';

    // First request is allowed
    const r1 = rateLimiter.checkRequest(testIp);
    Assert.isTrue(r1.allowed, 'First request within rate limit');

    // Apply penalty block
    rateLimiter.applyPenaltyBlock(testIp, 10);
    const blockedRes = rateLimiter.checkRequest(testIp);
    Assert.isFalse(blockedRes.allowed, 'Penalty blocked IP request is rejected');
    Assert.isTrue(blockedRes.penaltyBlocked === true, 'Penalty block flag is true');
  });

  it('should enforce RBAC and ABAC access control policies and ownership boundaries', () => {
    const acEngine = new AccessControlEngine();

    // 1. Seller modifying own product
    const sellerSubject = {
      userId: 'usr-seller-01',
      roles: ['SELLER'],
      permissions: ['products:update'],
      sellerId: 'seller-apple',
    };

    const ownProduct = {
      type: 'products',
      id: 'prod-01',
      sellerId: 'seller-apple',
    };

    const ownRes = acEngine.isAuthorized(sellerSubject, 'update', ownProduct);
    Assert.isTrue(ownRes.allowed, 'Seller can update their own product');

    // 2. Seller modifying another seller product
    const otherProduct = {
      type: 'products',
      id: 'prod-02',
      sellerId: 'seller-sony',
    };

    const otherRes = acEngine.isAuthorized(sellerSubject, 'update', otherProduct);
    Assert.isFalse(otherRes.allowed, 'Seller CANNOT update another seller product');

    // 3. SuperAdmin override
    const adminSubject = {
      userId: 'usr-admin-01',
      roles: ['SUPER_ADMIN'],
      permissions: ['*:root'],
      isSuperAdmin: true,
    };

    const adminRes = acEngine.isAuthorized(adminSubject, 'update', otherProduct);
    Assert.isTrue(adminRes.allowed, 'SuperAdmin can update any resource');
  });

  it('should detect geovelocity travel anomalies in user sessions', () => {
    const sessionMonitor = new SessionSecurityMonitor();

    // Session 1 in New York (lat: 40.71, lon: -74.00)
    sessionMonitor.registerSession({
      sessionId: 'sess-01',
      userId: 'usr-traveler-01',
      ipAddress: '198.51.100.10',
      userAgent: 'Mozilla/5.0',
      latitude: 40.7128,
      longitude: -74.0060,
      createdAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      lastActiveAt: Date.now() - 1000 * 60 * 30,
    });

    // Session 2 in Tokyo (lat: 35.67, lon: 139.65) 30 minutes later -> Impossible travel
    const anomalyCheck = sessionMonitor.registerSession({
      sessionId: 'sess-02',
      userId: 'usr-traveler-01',
      ipAddress: '203.0.113.88',
      userAgent: 'Mozilla/5.0',
      latitude: 35.6762,
      longitude: 139.6503,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    Assert.isTrue(anomalyCheck.isAnomaly, 'Geovelocity impossible travel anomaly detected');
  });

  it('should block SQL injection patterns using SecureQueryGuard', () => {
    const maliciousSQL = "SELECT * FROM users WHERE email = 'admin' OR 1=1; DROP TABLE products; --'";
    const guardRes = SecureQueryGuard.inspectQuerySafety(maliciousSQL, []);
    Assert.isFalse(guardRes.isSafe, 'SQL injection detected and blocked by SecureQueryGuard');
  });
});
