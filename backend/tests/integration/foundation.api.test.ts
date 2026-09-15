/**
 * Integration Tests: Backend Foundation, Health, Request IDs & Error Standards
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../src/app';
import { SystemHeaders } from '../../src/config/constants';

describe('API Integration: Backend Foundation & Observability', () => {
  it('GET /health should return 200 OK with system telemetry', async () => {
    const res = await request(app).get('/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'UP');
    assert.equal(res.body.data.service, 'ShopSphere-Backend');
    assert(res.body.meta.requestId !== undefined);
  });

  it('GET /ready and /live should return 200 OK', async () => {
    const readyRes = await request(app).get('/ready');
    assert.equal(readyRes.status, 200);
    assert.equal(readyRes.body.data.ready, true);

    const liveRes = await request(app).get('/live');
    assert.equal(liveRes.status, 200);
    assert.equal(liveRes.body.data.live, true);
  });

  it('should propagate client X-Request-Id header to response', async () => {
    const customId = 'custom-trace-uuid-12345';
    const res = await request(app).get('/health').set(SystemHeaders.REQUEST_ID, customId);

    assert.equal(res.headers[SystemHeaders.REQUEST_ID], customId);
    assert.equal(res.body.meta.requestId, customId);
  });

  it('should return standardized 404 error envelope on unmatched route', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'RES_NOT_FOUND');
    assert(res.body.error.message.includes('does not exist'));
    assert(res.body.error.requestId !== undefined);
    assert.equal(res.body.error.stack, undefined); // Ensure stack trace not exposed
  });

  it('GET /api/v1 should return API metadata and endpoint map', async () => {
    const res = await request(app).get('/api/v1');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ONLINE');
    assert.equal(res.body.data.phase, 'MEMBER_2_PHASE_1_FOUNDATION_AUTH_USERS');
  });
});
