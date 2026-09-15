/**
 * User Preferences Management Service
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IUserPreferenceRepository, IAuditLogRepository } from '../../repositories/interfaces/IUserPreferenceRepository';
import { UserPreferencesEntity } from '../users.types';
import { AuditAction } from '../../config/constants';
import { eventBus } from '../../core/events/EventBus';
import { logger } from '../../core/logger/Logger';

export interface UpdatePreferencesDTO {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
  orderUpdates?: boolean;
  securityAlerts?: boolean;
  language?: string;
  currency?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'system';
  twoFactorEnabled?: boolean;
}

export class UserPreferenceService {
  private readonly preferenceRepo: IUserPreferenceRepository;
  private readonly auditLogRepo: IAuditLogRepository;

  constructor(preferenceRepo: IUserPreferenceRepository, auditLogRepo: IAuditLogRepository) {
    this.preferenceRepo = preferenceRepo;
    this.auditLogRepo = auditLogRepo;
  }

  /**
   * Retrieves preferences for a user (creates default if none exist)
   */
  public async getPreferences(userId: string): Promise<UserPreferencesEntity> {
    let prefs = await this.preferenceRepo.findByUserId(userId);
    if (!prefs) {
      prefs = await this.preferenceRepo.resetToDefaults(userId);
    }
    return prefs;
  }

  /**
   * Updates preferences for a user
   */
  public async updatePreferences(userId: string, dto: UpdatePreferencesDTO): Promise<UserPreferencesEntity> {
    const updated = await this.preferenceRepo.updateByUserId(userId, dto);
    const result = updated || (await this.preferenceRepo.resetToDefaults(userId));

    await this.auditLogRepo.record(AuditAction.USER_PREFERENCES_UPDATE, { updatedKeys: Object.keys(dto) }, userId);

    await eventBus.publish('preferences.updated', {
      userId,
      updatedFields: Object.keys(dto),
    });

    logger.info(`Preferences updated for user '${userId}'`);
    return result;
  }

  /**
   * Resets preferences back to system defaults
   */
  public async resetPreferences(userId: string): Promise<UserPreferencesEntity> {
    const defaults = await this.preferenceRepo.resetToDefaults(userId);
    await this.auditLogRepo.record(AuditAction.USER_PREFERENCES_UPDATE, { reset: true }, userId);
    return defaults;
  }
}
