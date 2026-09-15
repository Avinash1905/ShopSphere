import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { SecurityRateLimiter } from '../../systems/security/rate_limiter.js';

describe('Security: Rate Limiting & DoS Defense Test', () => {
  it('should allow legitimate traffic while rejecting burst flooding attempts', () => {
    const rateLimiter = new SecurityRateLimiter();
    const attackerIp = '203.0.113.10';

    let allowedCount = 0;
    let blockedCount = 0;

    // Simulate 200 rapid burst requests
    for (let i = 0; i < 200; i++) {
      const res = rateLimiter.checkRequest(attackerIp);
      if (res.allowed) {
        allowedCount++;
      } else {
        blockedCount++;
      }
    }

    Assert.greaterThan(allowedCount, 0, 'Allowed normal initial requests');
    Assert.greaterThan(blockedCount, 50, 'Flooding requests throttled and blocked');
    Assert.equal(allowedCount + blockedCount, 200, 'All 200 requests evaluated');
  });
});
