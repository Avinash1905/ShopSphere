import { MigrationDatabaseAdapter } from '../../database/migrations/runner.js';
import { AuditRecordPayload } from './audit_types.js';

export class ImmutableAuditStore {
  private db: MigrationDatabaseAdapter;
  private buffer: AuditRecordPayload[] = [];
  private batchSize: number = 20;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async append(record: AuditRecordPayload): Promise<string> {
    const id = record.id || `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = record.timestamp || new Date().toISOString();

    const sql = `
      INSERT INTO audit_logs (
        id, actor_id, actor_type, actor_email, action, entity_name, entity_id,
        old_values, new_values, changed_fields, ip_address, user_agent, session_id,
        request_id, status, severity, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const oldJson = record.oldValues ? JSON.stringify(record.oldValues) : null;
    const newJson = record.newValues ? JSON.stringify(record.newValues) : null;
    const fieldsJson = JSON.stringify(record.changedFields || []);
    const metaJson = JSON.stringify(record.metadata || {});

    await this.db.execute(sql, [
      id,
      record.actorId || null,
      record.actorType || 'USER',
      record.actorEmail || null,
      record.action,
      record.entityName,
      record.entityId,
      oldJson,
      newJson,
      fieldsJson,
      record.ipAddress || null,
      record.userAgent || null,
      record.sessionId || null,
      record.requestId || null,
      record.status || 'SUCCESS',
      record.severity || 'INFO',
      metaJson,
      timestamp,
    ]);

    return id;
  }

  public async bufferRecord(record: AuditRecordPayload): Promise<void> {
    this.buffer.push(record);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  public async flush(): Promise<number> {
    if (this.buffer.length === 0) return 0;
    const recordsToFlush = [...this.buffer];
    this.buffer = [];

    for (const rec of recordsToFlush) {
      await this.append(rec);
    }
    return recordsToFlush.length;
  }
}
