/**
 * Authentication Types, Interfaces, and Entities
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Role, AccountStatusType, Permission } from '../config/constants';

export interface AuthTokenPayload {
  sub: string; // User ID
  email: string;
  username: string;
  role: Role;
  permissions: Permission[];
  status: AccountStatusType;
  sessionId?: string;
  iat?: number;
  exp?: number;
  jti?: string;
  iss?: string;
  aud?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
}

export interface AuthenticatedUserContext {
  id: string;
  email: string;
  username: string;
  role: Role;
  permissions: Permission[];
  status: AccountStatusType;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
    }
  }
}

export interface SessionEntity {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  revokedReason?: string;
}

export interface RefreshTokenEntity {
  id: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
  replacedByTokenHash?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PasswordResetEntity {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  ipAddress?: string;
  createdAt: Date;
}

export interface LoginAttemptEntity {
  id: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  createdAt: Date;
}

export interface LockoutInfo {
  isLocked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
  unlockAt?: Date;
  lockoutRemainingSeconds?: number;
}
