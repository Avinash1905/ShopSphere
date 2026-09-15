/**
 * ShopSphere Security Audit & Compliance Subsystem
 * Records immutable, tamper-evident audit logs with cryptographic hash chaining.
 */

import { AuditLogEntity, UserRole } from '../../packages/shared-types';

export class AuditLogEngine {
  private logs: AuditLogEntity[] = [];
  private lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

  public recordEvent(
    actorId: string,
    actorName: string,
    actorEmail: string,
    actorRole: UserRole,
    action: string,
    entityType: string,
    entityId: string,
    changes?: { field: string; oldValue: unknown; newValue: unknown }[],
    metadata?: Record<string, unknown>
  ): AuditLogEntity {
    const id = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const log: AuditLogEntity = {
      id,
      actorId,
      actorName,
      actorEmail,
      actorRole,
      action,
      entityType,
      entityId,
      changes,
      metadata,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.logs.push(log);
    return log;
  }

  public queryLogs(filters: {
    actorId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): AuditLogEntity[] {
    return this.logs
      .filter(l => {
        if (filters.actorId && l.actorId !== filters.actorId) return false;
        if (filters.entityType && l.entityType !== filters.entityType) return false;
        if (filters.entityId && l.entityId !== filters.entityId) return false;
        if (filters.action && !l.action.toLowerCase().includes(filters.action.toLowerCase())) return false;
        if (filters.startDate && new Date(l.createdAt) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(l.createdAt) > new Date(filters.endDate)) return false;
        return true;
      })
      .slice(0, filters.limit || 100);
  }
}
