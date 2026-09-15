import { BaseRepository, FindOptions, PaginatedResult } from './base.repository.js';
import { AuditLogEntity } from '../schema/audit_log.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface AuditSearchCriteria {
  actorId?: string;
  actorType?: string;
  action?: string;
  entityName?: string;
  entityId?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
}

export class AuditLogRepository extends BaseRepository<AuditLogEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('audit_logs', db);
  }

  public async recordEvent(event: Omit<AuditLogEntity, 'created_at'>): Promise<AuditLogEntity> {
    const logId = event.id || `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return await this.create({
      ...event,
      id: logId,
    });
  }

  public async getEntityHistory(entityName: string, entityId: string): Promise<AuditLogEntity[]> {
    const sql = `SELECT * FROM audit_logs WHERE entity_name = ? AND entity_id = ? ORDER BY created_at DESC`;
    const rows = await this.db.query<AuditLogEntity>(sql, [entityName, entityId]);
    return rows.map((r) => this.mapRow(r));
  }

  public async searchAuditLogs(
    criteria: AuditSearchCriteria,
    options: FindOptions<AuditLogEntity> = {}
  ): Promise<PaginatedResult<AuditLogEntity>> {
    const page = Math.max(1, options.pagination?.page || 1);
    const limit = Math.min(100, Math.max(1, options.pagination?.limit || 20));
    const offset = (page - 1) * limit;

    const clauses: string[] = [];
    const params: any[] = [];

    if (criteria.actorId) {
      clauses.push('actor_id = ?');
      params.push(criteria.actorId);
    }
    if (criteria.actorType) {
      clauses.push('actor_type = ?');
      params.push(criteria.actorType);
    }
    if (criteria.action) {
      clauses.push('action = ?');
      params.push(criteria.action);
    }
    if (criteria.entityName) {
      clauses.push('entity_name = ?');
      params.push(criteria.entityName);
    }
    if (criteria.entityId) {
      clauses.push('entity_id = ?');
      params.push(criteria.entityId);
    }
    if (criteria.severity) {
      clauses.push('severity = ?');
      params.push(criteria.severity);
    }
    if (criteria.ipAddress) {
      clauses.push('ip_address = ?');
      params.push(criteria.ipAddress);
    }
    if (criteria.startDate) {
      clauses.push('created_at >= ?');
      params.push(criteria.startDate);
    }
    if (criteria.endDate) {
      clauses.push('created_at <= ?');
      params.push(criteria.endDate);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total_count FROM audit_logs ${whereClause}`;
    const countRes = await this.db.query<{ total_count: number }>(countSql, params);
    const total = Number(countRes[0]?.total_count || 0);

    const dataSql = `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const rows = await this.db.query<AuditLogEntity>(dataSql, [...params, limit, offset]);
    const data = rows.map((r) => this.mapRow(r));
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
