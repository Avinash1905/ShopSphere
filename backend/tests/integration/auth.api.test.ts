/**
 * Integration Tests: Authentication API Endpoints (/api/v1/auth)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../src/app';
import { RepositoryFactory } from '../../src/repositories/memory/RepositoryFactory';

describe('API Integration: Authentication Endpoints', () => {
  beforeEach(() => {
    RepositoryFactory.resetAll();
  });

  const validCustomer = {
    email: 'testcustomer@shopsphere.com',
    username: 'test_customer',
    password: 'Sphere#Secure2026!',
    firstName: 'Test',
    lastName: 'Customer',
  };

  it('POST /api/v1/auth/register should create user and return tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validCustomer);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, validCustomer.email);
    assert.equal(res.body.data.user.role, 'CUSTOMER');
    assert(res.body.data.tokens.accessToken.length > 20);
    assert(res.body.data.tokens.refreshToken.length > 20);
  });

  it('POST /api/v1/auth/register should fail on duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(validCustomer);

    const dupRes = await request(app).post('/api/v1/auth/register').send({
      ...validCustomer,
      username: 'different_user',
    });

    assert.equal(dupRes.status, 409);
    assert.equal(dupRes.body.success, false);
    assert.equal(dupRes.body.error.code, 'AUTH_EMAIL_ALREADY_EXISTS');
  });

  it('POST /api/v1/auth/register should reject ADMIN role self-assignment', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      ...validCustomer,
      role: 'ADMIN',
    });

    assert.equal(res.status, 400); // Caught by schema validator or role escalation
    assert.equal(res.body.success, false);
  });

  it('POST /api/v1/auth/login should authenticate valid user', async () => {
    await request(app).post('/api/v1/auth/register').send(validCustomer);

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      emailOrUsername: validCustomer.email,
      password: validCustomer.password,
    });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.equal(loginRes.body.data.user.email, validCustomer.email);
    assert(loginRes.body.data.tokens.accessToken !== undefined);
  });

  it('POST /api/v1/auth/login should fail on incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send(validCustomer);

    const failRes = await request(app).post('/api/v1/auth/login').send({
      emailOrUsername: validCustomer.email,
      password: 'WrongPassword#123!',
    });

    assert.equal(failRes.status, 401);
    assert.equal(failRes.body.success, false);
    assert.equal(failRes.body.error.code, 'AUTH_INVALID_CREDENTIALS');
  });

  it('POST /api/v1/auth/refresh should rotate refresh token', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(validCustomer);
    const initialRefreshToken = regRes.body.data.tokens.refreshToken;

    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: initialRefreshToken,
    });

    assert.equal(refreshRes.status, 200);
    assert.equal(refreshRes.body.success, true);
    assert(refreshRes.body.data.accessToken !== undefined);
    assert(refreshRes.body.data.refreshToken !== initialRefreshToken); // rotated
  });

  it('POST /api/v1/auth/forgot-password and /reset-password should succeed locally', async () => {
    await request(app).post('/api/v1/auth/register').send(validCustomer);

    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({
      email: validCustomer.email,
    });

    assert.equal(forgotRes.status, 200);
    assert.equal(forgotRes.body.success, true);
    const resetToken = forgotRes.body.data.localTokenForDev;
    assert(resetToken !== undefined);

    // Reset password with token
    const newPassword = 'Sphere#NovelVault2026!';
    const resetRes = await request(app).post('/api/v1/auth/reset-password').send({
      token: resetToken,
      newPassword,
      confirmPassword: newPassword,
    });

    assert.equal(resetRes.status, 200);
    assert.equal(resetRes.body.success, true);

    // Login with new password
    const newLogin = await request(app).post('/api/v1/auth/login').send({
      emailOrUsername: validCustomer.email,
      password: newPassword,
    });

    assert.equal(newLogin.status, 200);
  });

  it('GET /api/v1/auth/me should return current user when authenticated', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(validCustomer);
    const accessToken = regRes.body.data.tokens.accessToken;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.email, validCustomer.email);
  });

  it('POST /api/v1/auth/logout should clear session', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(validCustomer);
    const { accessToken, refreshToken } = regRes.body.data.tokens;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.data.loggedOut, true);
  });
});
