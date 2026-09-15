/**
 * In-Memory User Preferences, Login Attempts, and Audit Log Repositories
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { IUserPreferenceRepository, ILoginAttemptRepository, IAuditLogRepository, AuditLogEntity } from '../interfaces/IUserPreferenceRepository';
import { UserPreferencesEntity } from '../../users/users.types';
import { LoginAttemptEntity } from '../../auth/auth.types';
import { QueryFilter, QueryOptions } from '../interfaces/IBaseRepository';

export class MemoryUserPreferenceRepository implements IUserPreferenceRepository {
  private readonly prefs = new Map<string, UserPreferencesEntity>();
  private readonly userIndex = new Map<string, string>(); // userId -> id

  public async findById(id: string): Promise<UserPreferencesEntity | null> {
    const p = this.prefs.get(id);
    return p ? { ...p } : null;
  }

  public async findByUserId(userId: string): Promise<UserPreferencesEntity | null> {
    const id = this.userIndex.get(userId);
    if (!id) {
      // Auto-create default preferences if none exist
      return this.resetToDefaults(userId);
    }
    return this.findById(id);
  }

  public async updateByUserId(userId: string, partial: Partial<UserPreferencesEntity>): Promise<UserPreferencesEntity | null> {
    let existing = await this.findByUserId(userId);
    if (!existing) {
      existing = await this.resetToDefaults(userId);
    }

    const updated: UserPreferencesEntity = {
      ...existing,
      ...partial,
      id: existing.id,
      userId,
      updatedAt: new Date(),
    };

    this.prefs.set(existing.id, updated);
    return { ...updated };
  }

  public async resetToDefaults(userId: string): Promise<UserPreferencesEntity> {
    const existingId = this.userIndex.get(userId);
    const id = existingId || uuidv4();
    const now = new Date();

    const defaults: UserPreferencesEntity = {
      id,
      userId,
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      orderUpdates: true,
      securityAlerts: true,
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
      theme: 'system',
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    };

    this.prefs.set(id, defaults);
    this.userIndex.set(userId, id);
    return { ...defaults };
  }

  public async findAll(filter?: QueryFilter<UserPreferencesEntity>, options?: QueryOptions<UserPreferencesEntity>): Promise<UserPreferencesEntity[]> {
    let result = Array.from(this.prefs.values());
    if (filter) {
      result = result.filter((p) => {
        for (const [key, expected] of Object.entries(filter)) {
          if (expected !== undefined && (p as any)[key] !== expected) {
            return false;
          }
        }
        return true;
      });
    }
    return result.map((p) => ({ ...p }));
  }

  public async count(filter?: QueryFilter<UserPreferencesEntity>): Promise<number> {
    const all = await this.findAll(filter);
    return all.length;
  }

  public async create(entity: UserPreferencesEntity): Promise<UserPreferencesEntity> {
    const id = entity.id || uuidv4();
    const now = new Date();
    const created: UserPreferencesEntity = {
      ...entity,
      id,
      createdAt: entity.createdAt || now,
      updatedAt: entity.updatedAt || now,
    };

    this.prefs.set(id, created);
    this.userIndex.set(created.userId, id);
    return { ...created };
  }

  public async update(id: string, partial: Partial<UserPreferencesEntity>): Promise<UserPreferencesEntity | null> {
    const existing = this.prefs.get(id);
    if (!existing) return null;

    const updated: UserPreferencesEntity = {
      ...existing,
      ...partial,
      id,
      updatedAt: new Date(),
    };

    this.prefs.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    const existing = this.prefs.get(id);
    if (!existing) return false;
    this.userIndex.delete(existing.userId);
    return this.prefs.delete(id);
  }

  public async exists(id: string): Promise<boolean> {
    return this.prefs.has(id);
  }

  public clear(): void {
    this.prefs.clear();
    this.userIndex.clear();
  }
}

export class MemoryLoginAttemptRepository implements ILoginAttemptRepository {
  private readonly attempts: LoginAttemptEntity[] = [];
  private readonly lockouts = new Map<string, Date>(); // email -> unlockAt

  public async recordAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    failureReason?: string
  ): Promise<LoginAttemptEntity> {
    const attempt: LoginAttemptEntity = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      ipAddress,
      userAgent,
      success,
      failureReason,
      createdAt: new Date(),
    };

    this.attempts.push(attempt);
    // Keep max 500 attempts in memory
    if (this.attempts.length > 500) {
      this.attempts.shift();
    }

    return attempt;
  }

  public async getFailedAttemptsCount(email: string, sinceDate: Date): Promise<number> {
    const clean = email.toLowerCase().trim();
    return this.attempts.filter((a) => a.email === clean && !a.success && a.createdAt >= sinceDate).length;
  }

  public async getRecentAttempts(email: string, limit = 10): Promise<LoginAttemptEntity[]> {
    const clean = email.toLowerCase().trim();
    return this.attempts
      .filter((a) => a.email === clean)
      .slice(-limit)
      .reverse();
  }

  public async clearFailedAttempts(email: string): Promise<void> {
    const clean = email.toLowerCase().trim();
    this.lockouts.delete(clean);
  }

  public async lockAccountUntil(email: string, unlockAt: Date): Promise<void> {
    const clean = email.toLowerCase().trim();
    this.lockouts.set(clean, unlockAt);
  }

  public async getLockoutExpiry(email: string): Promise<Date | null> {
    const clean = email.toLowerCase().trim();
    const unlockAt = this.lockouts.get(clean);
    if (!unlockAt) return null;

    if (unlockAt <= new Date()) {
      this.lockouts.delete(clean);
      return null;
    }

    return unlockAt;
  }

  public clear(): void {
    this.attempts.length = 0;
    this.lockouts.clear();
  }
}

export class MemoryAuditLogRepository implements IAuditLogRepository {
  private readonly logs: AuditLogEntity[] = [];

  public async record(
    action: string,
    details?: Record<string, unknown>,
    userId?: string,
    targetId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogEntity> {
    const log: AuditLogEntity = {
      id: uuidv4(),
      action,
      userId,
      targetId,
      ipAddress,
      userAgent,
      details,
      createdAt: new Date(),
    };

    this.logs.push(log);
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    return log;
  }

  public async findByUserId(userId: string, limit = 50): Promise<AuditLogEntity[]> {
    return this.logs
      .filter((l) => l.userId === userId)
      .slice(-limit)
      .reverse();
  }

  public async findByAction(action: string, limit = 50): Promise<AuditLogEntity[]> {
    return this.logs
      .filter((l) => l.action === action)
      .slice(-limit)
      .reverse();
  }

  public clear(): void {
    this.logs.length = 0;
  }
}
