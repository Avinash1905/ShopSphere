/**
 * Centralized Application Configuration
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import dotenv from 'dotenv';
import path from 'path';
import { validateAndLoadEnvironment, ValidatedEnvironment } from './env.validator';
import { defaultSecurityConfig } from './security.config';

// Load .env file safely if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let validatedEnv: ValidatedEnvironment;
try {
  validatedEnv = validateAndLoadEnvironment(process.env);
} catch (error) {
  // If in test or initial setup with fallback, load with defaults
  validatedEnv = validateAndLoadEnvironment({
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '5000',
  });
}

export interface AppConfig {
  env: ValidatedEnvironment;
  security: typeof defaultSecurityConfig;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

export const config: AppConfig = Object.freeze({
  env: validatedEnv,
  security: {
    ...defaultSecurityConfig,
    token: {
      ...defaultSecurityConfig.token,
      accessSecret: validatedEnv.JWT_ACCESS_SECRET,
      accessExpiresIn: validatedEnv.JWT_ACCESS_EXPIRES_IN,
      refreshSecret: validatedEnv.JWT_REFRESH_SECRET,
      refreshExpiresIn: validatedEnv.JWT_REFRESH_EXPIRES_IN,
      issuer: validatedEnv.JWT_ISSUER,
      audience: validatedEnv.JWT_AUDIENCE,
      resetTokenExpiresMinutes: validatedEnv.RESET_TOKEN_EXPIRES_MINUTES,
    },
    password: {
      ...defaultSecurityConfig.password,
      minLength: validatedEnv.PASSWORD_MIN_LENGTH,
      maxLength: validatedEnv.PASSWORD_MAX_LENGTH,
      requireUppercase: validatedEnv.PASSWORD_REQUIRE_UPPERCASE,
      requireLowercase: validatedEnv.PASSWORD_REQUIRE_LOWERCASE,
      requireNumbers: validatedEnv.PASSWORD_REQUIRE_NUMBERS,
      requireSymbols: validatedEnv.PASSWORD_REQUIRE_SYMBOLS,
      saltRounds: validatedEnv.PASSWORD_SALT_ROUNDS,
    },
    rateLimit: {
      ...defaultSecurityConfig.rateLimit,
      windowMs: validatedEnv.RATE_LIMIT_WINDOW_MS,
      maxRequests: validatedEnv.RATE_LIMIT_MAX_REQUESTS,
      authWindowMs: validatedEnv.AUTH_RATE_LIMIT_WINDOW_MS,
      authMaxRequests: validatedEnv.AUTH_RATE_LIMIT_MAX_REQUESTS,
    },
    lockout: {
      ...defaultSecurityConfig.lockout,
      maxAttempts: validatedEnv.MAX_LOGIN_ATTEMPTS,
      lockoutDurationMinutes: validatedEnv.LOCKOUT_DURATION_MINUTES,
    },
    cors: {
      ...defaultSecurityConfig.cors,
      allowedOrigins: validatedEnv.CORS_ORIGIN,
    },
  },
  isProduction: validatedEnv.NODE_ENV === 'production',
  isDevelopment: validatedEnv.NODE_ENV === 'development',
  isTest: validatedEnv.NODE_ENV === 'test',
});

export * from './constants';
export * from './security.config';
export * from './env.validator';
export default config;
