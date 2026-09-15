/**
 * Integration Tests: Users & Preferences API Endpoints (/api/v1/users)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../src/app';
import { RepositoryFactory } from '../../src/repositories/memory/RepositoryFactory';

describe('API Integration: User Profile & Preferences', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    RepositoryFactory.resetAll();

    const reg = await request(app).post('/api/v1/auth/register').send({
      email: 'alex@shopsphere.com',
      username: 'alex_shopper',
      password: 'Sphere#Secure2026!',
      firstName: 'Alex',
      lastName: 'Shopper',
    });

    authToken = reg.body.data.tokens.accessToken;
    userId = reg.body.data.user.id;
  });

  it('GET /api/v1/users/me should return authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.email, 'alex@shopsphere.com');
    assert.equal(res.body.data.fullName, 'Alex Shopper');
  });

  it('PATCH /api/v1/users/me should update profile details', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Alexander',
        bio: 'Tech enthusiast and smart shopper.',
        gender: 'MALE',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.firstName, 'Alexander');
    assert.equal(res.body.data.bio, 'Tech enthusiast and smart shopper.');
  });

  it('PATCH /api/v1/users/me/password should change password cleanly', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: 'Sphere#Secure2026!',
        newPassword: 'Sphere#BrandNew2026!',
        confirmPassword: 'Sphere#BrandNew2026!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.changed, true);

    // Verify login with new password succeeds
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      emailOrUsername: 'alex@shopsphere.com',
      password: 'Sphere#BrandNew2026!',
    });
    assert.equal(loginRes.status, 200);
  });

  it('GET and PATCH /api/v1/users/me/preferences should manage user settings', async () => {
    const getRes = await request(app)
      .get('/api/v1/users/me/preferences')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.language, 'en');

    // Update preferences
    const updateRes = await request(app)
      .patch('/api/v1/users/me/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        theme: 'dark',
        currency: 'EUR',
        marketingEmails: true,
      });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.theme, 'dark');
    assert.equal(updateRes.body.data.currency, 'EUR');
    assert.equal(updateRes.body.data.marketingEmails, true);

    // Reset preferences
    const resetRes = await request(app)
      .post('/api/v1/users/me/preferences/reset')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(resetRes.status, 200);
    assert.equal(resetRes.body.data.currency, 'USD');
  });
});
