import { MigrationDatabaseAdapter } from '../../database/migrations/runner.js';
import { AuditRecordPayload } from './audit_types.js';

export interface AuditFilterParams {
  actorId?: string;
  actorEmail?: string;
  action?: string;
  entityName?: string;
  entityId?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AuditQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async queryLogs(params: AuditFilterParams): Promise<{ logs: AuditRecordPayload[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 25));
    const offset = (page - 1) * limit;

    const clauses: string[] = [];
    const sqlParams: any[] = [];

    if (params.actorId) {
      clauses.push('actor_id = ?');
      sqlParams.push(params.actorId);
    }
    if (params.actorEmail) {
      clauses.push('actor_email LIKE ?');
      sqlParams.push(`%${params.actorEmail}%`);
    }
    if (params.action) {
      clauses.push('action = ?');
      sqlParams.push(params.action);
    }
    if (params.entityName) {
      clauses.push('entity_name = ?');
      sqlParams.push(params.entityName);
    }
    if (params.entityId) {
      clauses.push('entity_id = ?');
      sqlParams.push(params.entityId);
    }
    if (params.severity) {
      clauses.push('severity = ?');
      sqlParams.push(params.severity);
    }
    if (params.startDate) {
      clauses.push('created_at >= ?');
      sqlParams.push(params.startDate);
    }
    if (params.endDate) {
      clauses.push('created_at <= ?');
      sqlParams.push(params.endDate);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    const countRes = await this.db.query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_logs ${where}`, sqlParams);
    const total = Number(countRes[0]?.count || 0);

    const rows = await this.db.query<any>(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...sqlParams, limit, offset]
    );

    const logs: AuditRecordPayload[] = rows.map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      actorType: r.actor_type,
      actorEmail: r.actor_email,
      action: r.action,
      entityName: r.entity_name,
      entityId: r.entity_id,
      oldValues: r.old_values ? (typeof r.old_values === 'string' ? JSON.parse(r.old_values) : r.old_values) : null,
      newValues: r.new_values ? (typeof r.new_values === 'string' ? JSON.parse(r.new_values) : r.new_values) : null,
      changedFields: r.changed_fields ? (typeof r.changed_fields === 'string' ? JSON.parse(r.changed_fields) : r.changed_fields) : [],
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      sessionId: r.session_id,
      requestId: r.request_id,
      status: r.status,
      severity: r.severity,
      metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : {},
      timestamp: r.created_at,
    }));

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
