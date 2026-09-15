/**
 * Integration Tests: Address CRUD & Cross-User Security Isolation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../src/app';
import { RepositoryFactory } from '../../src/repositories/memory/RepositoryFactory';

describe('API Integration: Address CRUD & Isolation', () => {
  let userAToken: string;
  let userBToken: string;

  beforeEach(async () => {
    RepositoryFactory.resetAll();

    const regA = await request(app).post('/api/v1/auth/register').send({
      email: 'user.a@shopsphere.com',
      username: 'usera_shop',
      password: 'Sphere#Secure2026!',
      firstName: 'User',
      lastName: 'A',
    });
    userAToken = regA.body.data.tokens.accessToken;

    const regB = await request(app).post('/api/v1/auth/register').send({
      email: 'user.b@shopsphere.com',
      username: 'userb_shop',
      password: 'Sphere#Secure2026!',
      firstName: 'User',
      lastName: 'B',
    });
    userBToken = regB.body.data.tokens.accessToken;
  });

  it('should perform complete Address CRUD and enforce strict ownership isolation', async () => {
    // 1. User A creates Address
    const createRes = await request(app)
      .post('/api/v1/users/me/addresses')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        recipientName: 'User A Recipient',
        phoneNumber: '+14155552671',
        streetLine1: '500 Howard Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        countryCode: 'US',
        addressType: 'SHIPPING',
        isDefaultShipping: true,
      });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.success, true);
    const addressId = createRes.body.data.id;
    assert(addressId !== undefined);

    // 2. User A retrieves addresses list
    const listRes = await request(app)
      .get('/api/v1/users/me/addresses')
      .set('Authorization', `Bearer ${userAToken}`);

    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.data.length, 1);
    assert.equal(listRes.body.data[0].id, addressId);

    // 3. User A retrieves address by ID
    const getRes = await request(app)
      .get(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.recipientName, 'User A Recipient');

    // 4. CROSS-USER ISOLATION CHECK: User B attempts to access User A's address -> 403
    const unauthorizedGet = await request(app)
      .get(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    assert.equal(unauthorizedGet.status, 403);
    assert.equal(unauthorizedGet.body.success, false);
    assert.equal(unauthorizedGet.body.error.code, 'RBAC_ACCESS_DENIED');

    // 5. CROSS-USER ISOLATION CHECK: User B attempts to edit User A's address -> 403
    const unauthorizedPatch = await request(app)
      .patch(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ recipientName: 'Hacker Name' });

    assert.equal(unauthorizedPatch.status, 403);

    // 6. CROSS-USER ISOLATION CHECK: User B attempts to delete User A's address -> 403
    const unauthorizedDelete = await request(app)
      .delete(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    assert.equal(unauthorizedDelete.status, 403);

    // 7. User A updates their address
    const patchRes = await request(app)
      .patch(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ recipientName: 'User A Modified' });

    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.data.recipientName, 'User A Modified');

    // 8. User A deletes their address
    const deleteRes = await request(app)
      .delete(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.data.deleted, true);

    // 9. Verify address is gone
    const verifyRes = await request(app)
      .get(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.equal(verifyRes.status, 404);
  });
});
