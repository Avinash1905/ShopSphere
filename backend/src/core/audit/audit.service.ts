/**
 * Audit Logging and Compliance Subsystem
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IAuditLogRepository, AuditLogEntity } from '../../repositories/interfaces/IUserPreferenceRepository';
import { repositories } from '../../repositories';
import { logger } from '../logger/Logger';

export interface AuditLogSearchFilter {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export class AuditService {
  private readonly auditRepo: IAuditLogRepository;

  constructor(auditRepo: IAuditLogRepository = repositories.auditLogRepository) {
    this.auditRepo = auditRepo;
  }

  /**
   * Logs an action to the immutable audit trail
   */
  public async logAction(
    action: string,
    details?: Record<string, unknown>,
    userId?: string,
    targetId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogEntity> {
    const entry = await this.auditRepo.record(action, details, userId, targetId, ipAddress, userAgent);
    logger.debug(`[AUDIT] ${action} by user '${userId || 'system'}' on target '${targetId || 'none'}'`);
    return entry;
  }

  /**
   * Queries audit logs for a specific user
   */
  public async getUserAuditTrail(userId: string, limit = 50): Promise<AuditLogEntity[]> {
    return this.auditRepo.findByUserId(userId, limit);
  }

  /**
   * Queries audit logs by specific action
   */
  public async getLogsByAction(action: string, limit = 50): Promise<AuditLogEntity[]> {
    return this.auditRepo.findByAction(action, limit);
  }

  /**
   * Compliance helper: Anonymizes personal data in audit trail for GDPR compliance
   */
  public anonymizeDetailsForGdpr(details: Record<string, unknown>): Record<string, unknown> {
    const anonymized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(details)) {
      if (/email/i.test(key)) {
        anonymized[key] = '[ANONYMIZED_EMAIL]';
      } else if (/phone/i.test(key)) {
        anonymized[key] = '[ANONYMIZED_PHONE]';
      } else if (/name/i.test(key)) {
        anonymized[key] = '[ANONYMIZED_NAME]';
      } else if (/ip/i.test(key)) {
        anonymized[key] = '0.0.0.0';
      } else {
        anonymized[key] = val;
      }
    }
    return anonymized;
  }
}

export const auditService = new AuditService();
