/**
 * Security Configuration and Baseline Rules
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

export interface PasswordPolicyConfig {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  minEntropyBits: number;
  maxConsecutiveIdenticalChars: number;
  maxSequentialChars: number;
  disallowCommonPasswords: boolean;
  disallowUsernameSimilarity: boolean;
  disallowEmailSimilarity: boolean;
  historyCheckCount: number;
  saltRounds: number;
  disallowedPatterns: RegExp[];
  commonPasswordList: string[];
}

export interface RateLimitingConfig {
  windowMs: number;
  maxRequests: number;
  authWindowMs: number;
  authMaxRequests: number;
  resetPasswordWindowMs: number;
  resetPasswordMaxRequests: number;
  ipWhitelist: string[];
  skipSuccessfulRequests: boolean;
}

export interface LockoutConfig {
  maxAttempts: number;
  lockoutDurationMinutes: number;
  resetWindowMinutes: number;
  enableProgressiveDelays: boolean;
  delayMultipliers: number[];
}

export interface TokenSecurityConfig {
  accessSecret: string;
  accessExpiresIn: string;
  accessExpiresInSeconds: number;
  refreshSecret: string;
  refreshExpiresIn: string;
  refreshExpiresInSeconds: number;
  resetTokenExpiresMinutes: number;
  issuer: string;
  audience: string;
  rotationGracePeriodSeconds: number;
}

export interface CookieSecurityConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  domain?: string;
  signed: boolean;
}

export interface CorsSecurityConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAgeSeconds: number;
}

export const COMMON_PASSWORDS_DICTIONARY: string[] = [
  'password', 'password123', '123456', '12345678', '123456789', 'qwerty',
  '111111', '123123', 'welcome', 'admin', 'admin123', 'iloveyou', 'sunshine',
  'princess', 'football', 'monkey', 'shadow', 'master', 'dragon', 'baseball',
  'pass123', 'letmein', 'trustno1', 'superman', 'starwars', 'killer', 'test1234',
  'changeme', 'secret', 'default', 'root', 'guest', 'passcode', 'qwertyuiop',
  'asdfghjkl', 'zxcvbnm', 'abc12345', 'hunter2', 'liverpool', 'arsenal',
  'chelsea', 'manchester', 'barcelona', 'realmadrid'
];

export const LEET_SPEAK_MAPPINGS: Record<string, string[]> = {
  a: ['4', '@', '^'],
  b: ['8', '13'],
  c: ['(', '<'],
  e: ['3'],
  g: ['6', '9'],
  h: ['#'],
  i: ['1', '!', '|'],
  l: ['1', '|'],
  o: ['0'],
  s: ['5', '$'],
  t: ['7', '+'],
  z: ['2']
};

export const defaultSecurityConfig: {
  password: PasswordPolicyConfig;
  rateLimit: RateLimitingConfig;
  lockout: LockoutConfig;
  token: TokenSecurityConfig;
  cookie: CookieSecurityConfig;
  cors: CorsSecurityConfig;
} = {
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    minEntropyBits: 32,
    maxConsecutiveIdenticalChars: 3,
    maxSequentialChars: 4,
    disallowCommonPasswords: true,
    disallowUsernameSimilarity: true,
    disallowEmailSimilarity: true,
    historyCheckCount: 5,
    saltRounds: 10,
    disallowedPatterns: [
      /password/i,
      /shopsphere/i,
      /qwerty/i,
      /asdfgh/i,
      /123456/i,
    ],
    commonPasswordList: COMMON_PASSWORDS_DICTIONARY,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    authWindowMs: 15 * 60 * 1000,
    authMaxRequests: 20,
    resetPasswordWindowMs: 30 * 60 * 1000,
    resetPasswordMaxRequests: 5,
    ipWhitelist: ['127.0.0.1', '::1', 'localhost'],
    skipSuccessfulRequests: false,
  },
  lockout: {
    maxAttempts: 5,
    lockoutDurationMinutes: 15,
    resetWindowMinutes: 30,
    enableProgressiveDelays: true,
    delayMultipliers: [1, 2, 5, 10, 15],
  },
  token: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'local-jwt-access-secret-minimum-32-characters-dev-key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    accessExpiresInSeconds: 900,
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'local-jwt-refresh-secret-minimum-32-characters-dev-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    refreshExpiresInSeconds: 604800,
    resetTokenExpiresMinutes: 15,
    issuer: 'shopsphere-auth-service',
    audience: 'shopsphere-api-clients',
    rotationGracePeriodSeconds: 30,
  },
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    signed: true,
  },
  cors: {
    allowedOrigins: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Correlation-Id',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: [
      'X-Request-Id',
      'X-Correlation-Id',
      'X-Response-Time',
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
    ],
    credentials: true,
    maxAgeSeconds: 86400,
  },
};
