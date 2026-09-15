/**
 * Unit Tests: Password Policy & Entropy Verification
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PasswordUtils } from '../../src/core/security/password.utils';

describe('Password Policy & Strength Evaluator', () => {
  it('should accept a strong enterprise-grade password', () => {
    const result = PasswordUtils.evaluateStrength('ShopSphere#Secure2026!', {
      username: 'john_doe',
      email: 'john@example.com',
    });

    assert.equal(result.isValid, true);
    assert.equal(result.violations.length, 0);
    assert(result.score >= 3);
    assert(result.entropyBits >= 40);
  });

  it('should reject a password that is too short', () => {
    const result = PasswordUtils.evaluateStrength('Short1!');
    assert.equal(result.isValid, false);
    assert(result.violations.some((v) => v.includes('at least 8 characters')));
  });

  it('should reject passwords missing uppercase, lowercase, numbers, or symbols', () => {
    const noUpper = PasswordUtils.evaluateStrength('lowercase123!');
    assert.equal(noUpper.isValid, false);
    assert(noUpper.violations.some((v) => v.includes('uppercase letter')));

    const noLower = PasswordUtils.evaluateStrength('UPPERCASE123!');
    assert.equal(noLower.isValid, false);
    assert(noLower.violations.some((v) => v.includes('lowercase letter')));

    const noNum = PasswordUtils.evaluateStrength('Uppercase!Only');
    assert.equal(noNum.isValid, false);
    assert(noNum.violations.some((v) => v.includes('number')));

    const noSym = PasswordUtils.evaluateStrength('Uppercase1234');
    assert.equal(noSym.isValid, false);
    assert(noSym.violations.some((v) => v.includes('special character')));
  });

  it('should reject common dictionary passwords and leetspeak variants', () => {
    const common = PasswordUtils.evaluateStrength('Password123!');
    assert.equal(common.isValid, false);
    assert(common.violations.some((v) => v.includes('commonly compromised')));

    const leet = PasswordUtils.evaluateStrength('P@ssw0rd123!');
    assert.equal(leet.isValid, false);
  });

  it('should reject password containing user personal details', () => {
    const withUsername = PasswordUtils.evaluateStrength('JohnDoe#2026!', {
      username: 'johndoe',
      email: 'johndoe@example.com',
    });
    assert.equal(withUsername.isValid, false);
    assert(withUsername.violations.some((v) => v.includes('username')));
  });

  it('should hash and verify passwords correctly with bcrypt', async () => {
    const plain = 'MySecure#Password2026!';
    const hash = await PasswordUtils.hashPassword(plain, 8);

    assert(hash.startsWith('$2'));
    assert.notEqual(hash, plain);

    const match = await PasswordUtils.verifyPassword(plain, hash);
    assert.equal(match, true);

    const wrongMatch = await PasswordUtils.verifyPassword('WrongPassword123!', hash);
    assert.equal(wrongMatch, false);
  });
});
