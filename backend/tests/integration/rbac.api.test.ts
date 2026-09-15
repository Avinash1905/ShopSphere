/**
 * Integration Tests: Role-Based Access Control (RBAC) & Permissions
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../src/app';
import { RepositoryFactory } from '../../src/repositories/memory/RepositoryFactory';
import { AuthServiceFactory } from '../../src/auth/services';
import { Roles, AccountStatus } from '../../src/config/constants';
import { PermissionEvaluator } from '../../src/auth/permissions';

describe('API Integration: RBAC & Permissions Enforcement', () => {
  beforeEach(() => {
    RepositoryFactory.resetAll();
  });

  async function createTestUser(role: string, email: string) {
    const repos = RepositoryFactory.getRepositories();
    const authSvc = AuthServiceFactory.getServices();

    const hash = await authSvc.passwordService.hashPassword('Sphere#Secure2026!');
    const user = await repos.userRepository.create({
      id: `user-${email}`,
      email,
      username: email.split('@')[0],
      passwordHash: hash,
      role: role as any,
      status: AccountStatus.ACTIVE,
      firstName: 'Test',
      lastName: 'User',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const permissions = PermissionEvaluator.getPermissionsForRole(user.role);
    const token = authSvc.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions,
      status: user.status,
    });

    return { user, token };
  }

  it('should deny unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/users/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'AUTH_REQUIRED');
  });

  it('should forbid CUSTOMER from accessing Admin endpoints with 403 Forbidden', async () => {
    const { token: customerToken } = await createTestUser(Roles.CUSTOMER, 'cust@shopsphere.com');

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'RBAC_ACCESS_DENIED');
  });

  it('should allow ADMIN to access Admin endpoints with 200 OK', async () => {
    const { token: adminToken } = await createTestUser(Roles.ADMIN, 'admin@shopsphere.com');

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert(Array.isArray(res.body.data));
  });

  it('should allow ADMIN to suspend a user and block suspended user from subsequent calls', async () => {
    const { token: adminToken } = await createTestUser(Roles.ADMIN, 'superadmin@shopsphere.com');
    const { user: victimUser, token: victimToken } = await createTestUser(Roles.CUSTOMER, 'victim@shopsphere.com');

    // Admin suspends user
    const suspendRes = await request(app)
      .patch(`/api/v1/users/${victimUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: AccountStatus.SUSPENDED,
        reason: 'Violation of terms of service',
      });

    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.body.data.status, AccountStatus.SUSPENDED);

    // Victim makes a call with their token
    const callRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${victimToken}`);

    assert.equal(callRes.status, 403);
    assert.equal(callRes.body.error.code, 'AUTH_ACCOUNT_SUSPENDED');
  });
});
