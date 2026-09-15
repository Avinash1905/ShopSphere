/**
 * Test Suite: Advanced Security Subsystem Integration Test
 */

import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { CryptoKeyManager } from '../../systems/security/crypto_key_manager.js';
import { JWTSessionEngine } from '../../systems/security/jwt_session_engine.js';
import { ABACPolicyEvaluator } from '../../systems/security/abac_policy_evaluator.js';
import { CSPHeaderGenerator } from '../../systems/security/csp_header_generator.js';
import { LeakyBucketShaper } from '../../systems/security/leaky_bucket_shaper.js';

describe('Advanced Security Subsystem Test Suite', () => {
  it('should encrypt and decrypt sensitive data with AES-256-GCM and AAD', () => {
    const sensitiveData = 'stripe_sk_live_51MzXXXXXXXXXXXXXXXXXXXXXXX';
    const aad = 'tenant:shop-123';

    const encrypted = CryptoKeyManager.encrypt(sensitiveData, 'kms-v1', aad);
    Assert.isNotNull(encrypted.ciphertext);
    Assert.isNotNull(encrypted.iv);
    Assert.isNotNull(encrypted.authTag);

    const decrypted = CryptoKeyManager.decrypt(encrypted, aad);
    Assert.equal(decrypted, sensitiveData);
  });

  it('should sign, verify, and enforce revocation for JWT session tokens', () => {
    const token = JWTSessionEngine.sign({
      sub: 'user-999',
      email: 'alex@example.com',
      role: 'CUSTOMER',
    }, 3600);

    const decoded = JWTSessionEngine.verify(token);
    Assert.equal(decoded.sub, 'user-999');
    Assert.equal(decoded.email, 'alex@example.com');
    Assert.isTrue(decoded.exp > Math.floor(Date.now() / 1000));

    // Revoke token
    JWTSessionEngine.revoke(decoded.jti);
    Assert.isTrue(JWTSessionEngine.isRevoked(decoded.jti));

    let threw = false;
    try {
      JWTSessionEngine.verify(token);
    } catch {
      threw = true;
    }
    Assert.isTrue(threw, 'Should throw error when verifying revoked JWT token');
  });

  it('should evaluate declarative ABAC policy rules and enforce seller boundaries', () => {
    // 1. Seller modifying own product -> ALLOW
    const sellerSubj = { id: 'user-s1', role: 'SELLER', sellerId: 'seller-100', isVerified: true };
    const ownProduct = { type: 'product', id: 'p-1', sellerId: 'seller-100' };
    const res1 = ABACPolicyEvaluator.evaluate(sellerSubj, 'UPDATE', ownProduct);
    Assert.isTrue(res1.allowed);

    // 2. Seller modifying another seller's product -> DENY
    const otherProduct = { type: 'product', id: 'p-2', sellerId: 'seller-200' };
    const res2 = ABACPolicyEvaluator.evaluate(sellerSubj, 'UPDATE', otherProduct);
    Assert.isFalse(res2.allowed);

    // 3. Unverified seller attempting payout -> DENY
    const unverifiedSeller = { id: 'user-s2', role: 'SELLER', sellerId: 'seller-300', isVerified: false };
    const payoutRes = { type: 'seller_account', id: 'acc-1' };
    const res3 = ABACPolicyEvaluator.evaluate(unverifiedSeller, 'PAYOUT', payoutRes);
    Assert.isFalse(res3.allowed);
  });

  it('should generate strict Content-Security-Policy and HTTP defense headers', () => {
    const headers = CSPHeaderGenerator.generateHeaders({ reportUri: '/api/v1/csp-reports' });
    Assert.isTrue(headers['Content-Security-Policy'].includes("default-src 'self'"));
    Assert.isTrue(headers['Content-Security-Policy'].includes('nonce-'));
    Assert.isTrue(headers['Strict-Transport-Security'].includes('max-age=63072000'));
    Assert.equal(headers['X-Content-Type-Options'], 'nosniff');
    Assert.equal(headers['X-Frame-Options'], 'DENY');
  });

  it('should shape traffic using leaky bucket and detect abusive IP subnets', () => {
    LeakyBucketShaper.clear();

    const clientKey = 'ip:198.51.100.42';
    // Consume full bucket capacity (10 tokens)
    for (let i = 0; i < 10; i++) {
      const res = LeakyBucketShaper.checkAndConsume(clientKey, 10, 2, 1);
      Assert.isTrue(res.allowed);
    }

    // 11th request overflows bucket
    const overflow = LeakyBucketShaper.checkAndConsume(clientKey, 10, 2, 1);
    Assert.isFalse(overflow.allowed);
    Assert.greaterThan(overflow.estimatedWaitMs, 0);

    // Subnet abuse scoring
    LeakyBucketShaper.reportSubnetAbuse('198.51.100.42', 30);
    LeakyBucketShaper.reportSubnetAbuse('198.51.100.99', 25);
    Assert.isTrue(LeakyBucketShaper.isSubnetFlagged('198.51.100.1')); // Total 55 >= 50
  });
});
