/**
 * Environment Configuration Validator and Loader
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

export interface ValidatedEnvironment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  APP_NAME: string;
  APP_VERSION: string;
  API_PREFIX: string;
  CORS_ORIGIN: string[];
  COOKIE_SECRET: string;
  TRUST_PROXY: boolean;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  PASSWORD_MIN_LENGTH: number;
  PASSWORD_MAX_LENGTH: number;
  PASSWORD_REQUIRE_UPPERCASE: boolean;
  PASSWORD_REQUIRE_LOWERCASE: boolean;
  PASSWORD_REQUIRE_NUMBERS: boolean;
  PASSWORD_REQUIRE_SYMBOLS: boolean;
  PASSWORD_SALT_ROUNDS: number;
  MAX_LOGIN_ATTEMPTS: number;
  LOCKOUT_DURATION_MINUTES: number;
  RESET_TOKEN_EXPIRES_MINUTES: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  AUTH_RATE_LIMIT_WINDOW_MS: number;
  AUTH_RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  LOG_FORMAT: 'json' | 'pretty';
  ENABLE_AUDIT_LOG: boolean;
  DATABASE_ADAPTER: 'memory' | 'postgres' | 'mysql' | 'sqlite';
  DATABASE_URL?: string;
}

export class EnvironmentValidationError extends Error {
  public readonly errors: string[];

  constructor(errors: string[]) {
    super(`Environment validation failed:\n  - ${errors.join('\n  - ')}`);
    this.name = 'EnvironmentValidationError';
    this.errors = errors;
  }
}

export function validateAndLoadEnvironment(env: NodeJS.ProcessEnv = process.env): ValidatedEnvironment {
  const errors: string[] = [];

  // NODE_ENV
  const rawNodeEnv = env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(rawNodeEnv)) {
    errors.push(`Invalid NODE_ENV: "${rawNodeEnv}". Expected 'development', 'production', or 'test'.`);
  }
  const NODE_ENV = rawNodeEnv as 'development' | 'production' | 'test';

  // PORT
  const rawPort = env.PORT || '5000';
  const PORT = parseInt(rawPort, 10);
  if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
    errors.push(`Invalid PORT: "${rawPort}". Must be a valid port number between 1 and 65535.`);
  }

  // HOST
  const HOST = env.HOST || '0.0.0.0';

  // APP_NAME & VERSION & PREFIX
  const APP_NAME = env.APP_NAME || 'ShopSphere-Backend';
  const APP_VERSION = env.APP_VERSION || '1.0.0';
  let API_PREFIX = env.API_PREFIX || '/api/v1';
  if (!API_PREFIX.startsWith('/')) {
    API_PREFIX = `/${API_PREFIX}`;
  }

  // CORS_ORIGIN
  const rawCors = env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173';
  const CORS_ORIGIN = rawCors.split(',').map((o) => o.trim()).filter(Boolean);
  if (CORS_ORIGIN.length === 0) {
    errors.push('CORS_ORIGIN must contain at least one valid origin URL.');
  }

  // COOKIE_SECRET
  const COOKIE_SECRET = env.COOKIE_SECRET || 'local-development-cookie-secret-min-32-chars-key-dev';
  if (NODE_ENV === 'production' && COOKIE_SECRET.length < 32) {
    errors.push('COOKIE_SECRET must be at least 32 characters in production.');
  }

  // TRUST_PROXY
  const TRUST_PROXY = env.TRUST_PROXY === 'true' || env.TRUST_PROXY === '1';

  // JWT Secrets
  const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET || 'local-jwt-access-secret-minimum-32-characters-dev-key';
  const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || 'local-jwt-refresh-secret-minimum-32-characters-dev-key';
  if (NODE_ENV === 'production') {
    if (JWT_ACCESS_SECRET.length < 32) {
      errors.push('JWT_ACCESS_SECRET must be at least 32 characters in production.');
    }
    if (JWT_REFRESH_SECRET.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters in production.');
    }
    if (JWT_ACCESS_SECRET === JWT_REFRESH_SECRET) {
      errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be identical.');
    }
  }

  const JWT_ACCESS_EXPIRES_IN = env.JWT_ACCESS_EXPIRES_IN || '15m';
  const JWT_REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN || '7d';
  const JWT_ISSUER = env.JWT_ISSUER || 'shopsphere-auth-service';
  const JWT_AUDIENCE = env.JWT_AUDIENCE || 'shopsphere-api-clients';

  // Password Policy
  const PASSWORD_MIN_LENGTH = parseInt(env.PASSWORD_MIN_LENGTH || '8', 10);
  const PASSWORD_MAX_LENGTH = parseInt(env.PASSWORD_MAX_LENGTH || '128', 10);
  if (PASSWORD_MIN_LENGTH < 6 || PASSWORD_MIN_LENGTH > PASSWORD_MAX_LENGTH) {
    errors.push(`Invalid PASSWORD_MIN_LENGTH (${PASSWORD_MIN_LENGTH}). Must be >= 6 and <= max length.`);
  }

  const PASSWORD_REQUIRE_UPPERCASE = env.PASSWORD_REQUIRE_UPPERCASE !== 'false';
  const PASSWORD_REQUIRE_LOWERCASE = env.PASSWORD_REQUIRE_LOWERCASE !== 'false';
  const PASSWORD_REQUIRE_NUMBERS = env.PASSWORD_REQUIRE_NUMBERS !== 'false';
  const PASSWORD_REQUIRE_SYMBOLS = env.PASSWORD_REQUIRE_SYMBOLS !== 'false';
  const PASSWORD_SALT_ROUNDS = parseInt(env.PASSWORD_SALT_ROUNDS || '10', 10);

  // Lockout
  const MAX_LOGIN_ATTEMPTS = parseInt(env.MAX_LOGIN_ATTEMPTS || '5', 10);
  const LOCKOUT_DURATION_MINUTES = parseInt(env.LOCKOUT_DURATION_MINUTES || '15', 10);
  const RESET_TOKEN_EXPIRES_MINUTES = parseInt(env.RESET_TOKEN_EXPIRES_MINUTES || '15', 10);

  // Rate Limiting
  const RATE_LIMIT_WINDOW_MS = parseInt(env.RATE_LIMIT_WINDOW_MS || '900000', 10);
  const RATE_LIMIT_MAX_REQUESTS = parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
  const AUTH_RATE_LIMIT_WINDOW_MS = parseInt(env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10);
  const AUTH_RATE_LIMIT_MAX_REQUESTS = parseInt(env.AUTH_RATE_LIMIT_MAX_REQUESTS || '20', 10);

  // Logging
  const rawLogLevel = env.LOG_LEVEL || 'debug';
  if (!['debug', 'info', 'warn', 'error'].includes(rawLogLevel)) {
    errors.push(`Invalid LOG_LEVEL: "${rawLogLevel}". Expected 'debug', 'info', 'warn', or 'error'.`);
  }
  const LOG_LEVEL = rawLogLevel as 'debug' | 'info' | 'warn' | 'error';

  const rawLogFormat = env.LOG_FORMAT || (NODE_ENV === 'production' ? 'json' : 'pretty');
  if (!['json', 'pretty'].includes(rawLogFormat)) {
    errors.push(`Invalid LOG_FORMAT: "${rawLogFormat}". Expected 'json' or 'pretty'.`);
  }
  const LOG_FORMAT = rawLogFormat as 'json' | 'pretty';

  const ENABLE_AUDIT_LOG = env.ENABLE_AUDIT_LOG !== 'false';

  // Database Adapter (Member 3 Boundary)
  const rawDbAdapter = env.DATABASE_ADAPTER || 'memory';
  if (!['memory', 'postgres', 'mysql', 'sqlite'].includes(rawDbAdapter)) {
    errors.push(`Invalid DATABASE_ADAPTER: "${rawDbAdapter}". Supported: 'memory', 'postgres', 'mysql', 'sqlite'.`);
  }
  const DATABASE_ADAPTER = rawDbAdapter as 'memory' | 'postgres' | 'mysql' | 'sqlite';

  const DATABASE_URL = env.DATABASE_URL;

  if (errors.length > 0) {
    throw new EnvironmentValidationError(errors);
  }

  return {
    NODE_ENV,
    PORT,
    HOST,
    APP_NAME,
    APP_VERSION,
    API_PREFIX,
    CORS_ORIGIN,
    COOKIE_SECRET,
    TRUST_PROXY,
    JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN,
    JWT_ISSUER,
    JWT_AUDIENCE,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_REQUIRE_UPPERCASE,
    PASSWORD_REQUIRE_LOWERCASE,
    PASSWORD_REQUIRE_NUMBERS,
    PASSWORD_REQUIRE_SYMBOLS,
    PASSWORD_SALT_ROUNDS,
    MAX_LOGIN_ATTEMPTS,
    LOCKOUT_DURATION_MINUTES,
    RESET_TOKEN_EXPIRES_MINUTES,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS,
    AUTH_RATE_LIMIT_WINDOW_MS,
    AUTH_RATE_LIMIT_MAX_REQUESTS,
    LOG_LEVEL,
    LOG_FORMAT,
    ENABLE_AUDIT_LOG,
    DATABASE_ADAPTER,
    DATABASE_URL,
  };
}
