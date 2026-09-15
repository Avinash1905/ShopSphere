/**
 * User Preferences, Login Attempts, and Audit Log Interfaces
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IBaseRepository } from './IBaseRepository';
import { UserPreferencesEntity } from '../../users/users.types';
import { LoginAttemptEntity } from '../../auth/auth.types';
import { AuditActionType } from '../../config/constants';

export interface IUserPreferenceRepository extends IBaseRepository<UserPreferencesEntity, string> {
  findByUserId(userId: string): Promise<UserPreferencesEntity | null>;
  updateByUserId(userId: string, partial: Partial<UserPreferencesEntity>): Promise<UserPreferencesEntity | null>;
  resetToDefaults(userId: string): Promise<UserPreferencesEntity>;
}

export interface ILoginAttemptRepository {
  recordAttempt(email: string, success: boolean, ipAddress?: string, userAgent?: string, failureReason?: string): Promise<LoginAttemptEntity>;
  getFailedAttemptsCount(email: string, sinceDate: Date): Promise<number>;
  getRecentAttempts(email: string, limit?: number): Promise<LoginAttemptEntity[]>;
  clearFailedAttempts(email: string): Promise<void>;
  lockAccountUntil(email: string, unlockAt: Date): Promise<void>;
  getLockoutExpiry(email: string): Promise<Date | null>;
}

export interface AuditLogEntity {
  id: string;
  action: AuditActionType | string;
  userId?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export interface IAuditLogRepository {
  record(action: AuditActionType | string, details?: Record<string, unknown>, userId?: string, targetId?: string, ipAddress?: string, userAgent?: string): Promise<AuditLogEntity>;
  findByUserId(userId: string, limit?: number): Promise<AuditLogEntity[]>;
  findByAction(action: string, limit?: number): Promise<AuditLogEntity[]>;
}
