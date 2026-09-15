/**
 * ShopSphere Database Repositories - Security Event Ledger, GDPR Erasure & Compliance Repository
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import * as crypto from 'crypto';

export interface SecurityEventRecord {
  id: string;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  actor_user_id?: string;
  ip_address: string;
  user_agent?: string;
  resource_accessed?: string;
  action_status: string;
  event_data?: any;
  tamper_hash: string;
  created_at: string;
}

export interface DataAccessLog {
  id: string;
  accessor_user_id: string;
  target_table: string;
  target_record_id: string;
  pii_fields_accessed: string[];
  access_purpose: string;
  ip_address: string;
  created_at: string;
}

export interface GdprErasureRequest {
  id: string;
  user_id: string;
  requester_email: string;
  verification_token: string;
  status: 'PENDING' | 'VERIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  anonymized_at?: string;
  proof_hash?: string;
  created_at: string;
  completed_at?: string;
}

export interface ComplianceManifest {
  id: string;
  framework: string;
  control_id: string;
  status: 'PASSED' | 'FAILED' | 'EXCEPTION' | 'NOT_APPLICABLE';
  evidence_url?: string;
  tested_at: string;
  tested_by: string;
  metadata?: any;
}

export class SecurityLedgerRepository extends BaseRepository<SecurityEventRecord> {
  constructor(db: MigrationDatabaseAdapter) {
    super('security_events_ledger', db);
  }

  public async recordSecurityEvent(
    event: Omit<SecurityEventRecord, 'id' | 'tamper_hash' | 'created_at'> & { id?: string }
  ): Promise<SecurityEventRecord> {
    const id = event.id || `secevt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Query last event hash to build cryptographic ledger chain
    const lastRows = await this.db.query<{ tamper_hash: string }>(
      'SELECT tamper_hash FROM security_events_ledger ORDER BY created_at DESC LIMIT 1'
    );
    const prevHash = lastRows[0]?.tamper_hash || '00000000000000000000000000000000';

    const hashInput = `${id}|${event.event_type}|${event.actor_user_id || 'anonymous'}|${event.ip_address}|${now}|${prevHash}`;
    const tamperHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    return this.create({
      id,
      ...event,
      tamper_hash: tamperHash,
      created_at: now,
    });
  }

  public async logDataAccess(log: Omit<DataAccessLog, 'id' | 'created_at'> & { id?: string }): Promise<DataAccessLog> {
    const id = log.id || `dacc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      ...log,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO data_access_logs (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<DataAccessLog>('SELECT * FROM data_access_logs WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as DataAccessLog;
  }

  public async requestGdprErasure(userId: string, email: string): Promise<GdprErasureRequest> {
    const id = `gdpr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    const clean = this.unmapEntity({
      id,
      user_id: userId,
      requester_email: email,
      verification_token: token,
      status: 'PENDING',
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO gdpr_erasure_requests (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<GdprErasureRequest>('SELECT * FROM gdpr_erasure_requests WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as GdprErasureRequest;
  }

  public async completeGdprErasure(requestId: string): Promise<GdprErasureRequest> {
    const now = new Date().toISOString();
    const proofHash = crypto.createHash('sha256').update(`ANONYMIZED_${requestId}_${now}`).digest('hex');

    await this.db.execute(
      `UPDATE gdpr_erasure_requests SET status = 'COMPLETED', anonymized_at = ?, completed_at = ?, proof_hash = ? WHERE id = ?`,
      [now, now, proofHash, requestId]
    );

    const rows = await this.db.query<GdprErasureRequest>('SELECT * FROM gdpr_erasure_requests WHERE id = ?', [requestId]);
    return this.mapRow(rows[0]) as unknown as GdprErasureRequest;
  }
}
