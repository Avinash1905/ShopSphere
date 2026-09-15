/**
 * Unit Tests: ABAC Policy Engine
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AbacPolicyEngine } from '../../src/auth/permissions/abac.policy';
import { Roles, AccountStatus } from '../../src/config/constants';

describe('ABAC Policy Engine', () => {
  it('should allow resource owner to access own resource', () => {
    const result = AbacPolicyEngine.evaluate(
      {
        id: 'user-123',
        role: Roles.CUSTOMER,
        permissions: [],
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      },
      'read',
      {
        type: 'ADDRESS',
        id: 'addr-456',
        ownerId: 'user-123',
      }
    );

    assert.equal(result.decision, 'ALLOW');
  });

  it('should deny non-owner from accessing another user resource', () => {
    const result = AbacPolicyEngine.evaluate(
      {
        id: 'user-attacker',
        role: Roles.CUSTOMER,
        permissions: [],
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      },
      'read',
      {
        type: 'ADDRESS',
        id: 'addr-456',
        ownerId: 'user-victim',
      }
    );

    assert.equal(result.decision, 'DENY');
    assert.equal(result.reason, 'Cross-user access denied');
  });

  it('should allow admin to override and access any resource', () => {
    const result = AbacPolicyEngine.evaluate(
      {
        id: 'admin-1',
        role: Roles.ADMIN,
        permissions: [],
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      },
      'delete',
      {
        type: 'USER',
        id: 'user-victim',
        ownerId: 'user-victim',
      }
    );

    assert.equal(result.decision, 'ALLOW');
    assert.equal(result.reason, 'Administrator override');
  });

  it('should deny suspended user even if owner of resource', () => {
    const result = AbacPolicyEngine.evaluate(
      {
        id: 'suspended-user',
        role: Roles.CUSTOMER,
        permissions: [],
        status: AccountStatus.SUSPENDED,
        emailVerified: true,
      },
      'read',
      {
        type: 'USER',
        id: 'suspended-user',
        ownerId: 'suspended-user',
      }
    );

    assert.equal(result.decision, 'DENY');
    assert.equal(result.reason, 'Account is suspended');
  });
});
