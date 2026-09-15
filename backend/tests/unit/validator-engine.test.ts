/**
 * Unit Tests: Pure TypeScript Validation Engine
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { v } from '../../src/validators/validator.engine';

describe('Validator Engine', () => {
  it('should validate string schemas with constraints', () => {
    const schema = v.string().required().min(3).max(10).trim();

    const validRes = schema.validate('  hello  ');
    assert.equal(validRes.errors.length, 0);
    assert.equal(validRes.value, 'hello');

    const shortRes = schema.validate('hi');
    assert.equal(shortRes.errors.length, 1);
    assert.equal(shortRes.errors[0].code, 'MIN_LENGTH');

    const emptyRes = schema.validate('');
    assert.equal(emptyRes.errors.length, 1);
    assert.equal(emptyRes.errors[0].code, 'REQUIRED');
  });

  it('should validate email format properly', () => {
    const emailSchema = v.string().required().email().lowercase();

    const validRes = emailSchema.validate('Test@ShopSphere.COM');
    assert.equal(validRes.errors.length, 0);
    assert.equal(validRes.value, 'test@shopsphere.com');

    const invalidRes = emailSchema.validate('invalid-email-address');
    assert.equal(invalidRes.errors.length, 1);
    assert.equal(invalidRes.errors[0].code, 'INVALID_EMAIL');
  });

  it('should validate number schemas with integer and min/max rules', () => {
    const numSchema = v.number().required().integer().min(1).max(100);

    assert.equal(numSchema.validate(50).errors.length, 0);
    assert.equal(numSchema.validate('42').value, 42);

    const floatRes = numSchema.validate(42.5);
    assert.equal(floatRes.errors.length, 1);
    assert.equal(floatRes.errors[0].code, 'NOT_AN_INTEGER');

    const tooHighRes = numSchema.validate(150);
    assert.equal(tooHighRes.errors.length, 1);
    assert.equal(tooHighRes.errors[0].code, 'MAX_VALUE');
  });

  it('should validate object schemas and report nested errors', () => {
    const userSchema = v.object({
      name: v.string().required().min(2),
      age: v.number().optional().min(18),
      role: v.string().required().oneOf(['CUSTOMER', 'SELLER']),
    });

    const valid = userSchema.parse({
      name: 'Alice',
      age: 25,
      role: 'CUSTOMER',
    });
    assert.equal(valid.isValid, true);
    assert.equal(valid.errors.length, 0);

    const invalid = userSchema.parse({
      name: 'A',
      age: 15,
      role: 'INVALID_ROLE',
    });
    assert.equal(invalid.isValid, false);
    assert.equal(invalid.errors.length, 3);
  });
});
