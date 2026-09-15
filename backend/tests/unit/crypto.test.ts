/**
 * Unit Tests: Cryptographic Utilities
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CryptoUtils } from '../../src/core/security/crypto.utils';

describe('CryptoUtils', () => {
  it('should generate secure random tokens of requested length', () => {
    const token1 = CryptoUtils.generateSecureToken(32);
    const token2 = CryptoUtils.generateSecureToken(32);

    assert.equal(token1.length, 64); // 32 bytes in hex = 64 chars
    assert.equal(token2.length, 64);
    assert.notEqual(token1, token2);
  });

  it('should generate url-safe tokens', () => {
    const urlToken = CryptoUtils.generateUrlSafeToken(32);
    assert.match(urlToken, /^[A-Za-z0-9_-]+$/);
  });

  it('should hash with sha-256 predictably', () => {
    const hash1 = CryptoUtils.hashSha256('secret-token-value');
    const hash2 = CryptoUtils.hashSha256('secret-token-value');
    const hash3 = CryptoUtils.hashSha256('different-value');

    assert.equal(hash1, hash2);
    assert.notEqual(hash1, hash3);
    assert.equal(hash1.length, 64);
  });

  it('should perform constant-time string comparisons', () => {
    const strA = 'correct-password-token-12345';
    const strB = 'correct-password-token-12345';
    const strC = 'wrong-password-token-67890';

    assert.equal(CryptoUtils.timingSafeCompare(strA, strB), true);
    assert.equal(CryptoUtils.timingSafeCompare(strA, strC), false);
    assert.equal(CryptoUtils.timingSafeCompare(strA, ''), false);
  });

  it('should validate UUID v4 correctly', () => {
    assert.equal(CryptoUtils.isValidUuid('c9bf9e57-1685-4c89-bafb-ff5af830be8a'), true);
    assert.equal(CryptoUtils.isValidUuid('not-a-uuid'), false);
    assert.equal(CryptoUtils.isValidUuid('12345'), false);
  });
});
