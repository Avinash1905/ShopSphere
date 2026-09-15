/**
 * Unit Tests: Configuration & Environment Validation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAndLoadEnvironment, EnvironmentValidationError } from '../../src/config/env.validator';

describe('Configuration & Environment Validator', () => {
  it('should load default environment variables cleanly', () => {
    const env = validateAndLoadEnvironment({
      NODE_ENV: 'development',
      PORT: '5000',
    });

    assert.equal(env.NODE_ENV, 'development');
    assert.equal(env.PORT, 5000);
    assert.equal(env.API_PREFIX, '/api/v1');
    assert.equal(env.MAX_LOGIN_ATTEMPTS, 5);
    assert.equal(env.LOCKOUT_DURATION_MINUTES, 15);
  });

  it('should throw EnvironmentValidationError on invalid PORT', () => {
    assert.throws(
      () => {
        validateAndLoadEnvironment({
          PORT: 'not-a-port',
        });
      },
      (err: any) => {
        assert(err instanceof EnvironmentValidationError);
        assert(err.errors.some((e: string) => e.includes('Invalid PORT')));
        return true;
      }
    );
  });

  it('should throw EnvironmentValidationError on invalid NODE_ENV', () => {
    assert.throws(
      () => {
        validateAndLoadEnvironment({
          NODE_ENV: 'invalid_env' as any,
        });
      },
      (err: any) => {
        assert(err instanceof EnvironmentValidationError);
        assert(err.errors.some((e: string) => e.includes('Invalid NODE_ENV')));
        return true;
      }
    );
  });

  it('should enforce 32-character secrets in production mode', () => {
    assert.throws(
      () => {
        validateAndLoadEnvironment({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'too-short',
          JWT_REFRESH_SECRET: 'also-too-short',
          COOKIE_SECRET: 'short-cookie-secret',
        });
      },
      (err: any) => {
        assert(err instanceof EnvironmentValidationError);
        assert(err.errors.length >= 2);
        return true;
      }
    );
  });
});
