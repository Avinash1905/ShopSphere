/**
 * ShopSphere Database Repositories - User MFA, OAuth, Session & API Key Repository
 * Implements authentication credentials, session tracking, TOTP devices, and scoped API key storage.
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface UserMfaDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'TOTP' | 'WEBAUTHN' | 'SMS' | 'EMAIL_OTP';
  secret_encrypted: string;
  backup_codes_encrypted?: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserOAuthProvider {
  id: string;
  user_id: string;
  provider_name: string;
  provider_user_id: string;
  access_token_encrypted?: string;
  refresh_token_encrypted?: string;
  token_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPasswordHistory {
  id: string;
  user_id: string;
  password_hash: string;
  created_at: string;
}

export interface UserSessionRecord {
  id: string;
  user_id: string;
  session_token_hash: string;
  ip_address: string;
  user_agent?: string;
  device_fingerprint?: string;
  is_revoked: boolean;
  expires_at: string;
  created_at: string;
  last_accessed_at: string;
}

export interface UserApiKey {
  id: string;
  user_id: string;
  key_name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  rate_limit_per_minute: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  last_used_at?: string;
}

export class UserMfaRepository extends BaseRepository<UserMfaDevice> {
  constructor(db: MigrationDatabaseAdapter) {
    super('user_mfa_devices', db);
  }

  public async findActiveDevicesByUser(userId: string): Promise<UserMfaDevice[]> {
    const res = await this.findAll({
      where: [
        { field: 'user_id', operator: 'EQ', value: userId },
        { field: 'is_active', operator: 'EQ', value: 1 },
      ],
      sort: [{ field: 'created_at', direction: 'DESC' }],
    });
    return res.data;
  }

  public async registerDevice(device: Omit<UserMfaDevice, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<UserMfaDevice> {
    const now = new Date().toISOString();
    const id = device.id || `mfa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return this.create({
      id,
      ...device,
      created_at: now,
      updated_at: now,
    });
  }

  public async recordDeviceUsage(deviceId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.update(deviceId, { last_used_at: now } as any);
  }

  public async findSessionByTokenHash(tokenHash: string): Promise<UserSessionRecord | null> {
    const sql = `SELECT * FROM user_sessions WHERE session_token_hash = ? AND is_revoked = 0 AND expires_at > ? LIMIT 1`;
    const now = new Date().toISOString();
    const rows = await this.db.query<UserSessionRecord>(sql, [tokenHash, now]);
    return rows.length > 0 ? (this.mapRow(rows[0]) as unknown as UserSessionRecord) : null;
  }

  public async createSession(session: Omit<UserSessionRecord, 'id' | 'created_at' | 'last_accessed_at'> & { id?: string }): Promise<UserSessionRecord> {
    const now = new Date().toISOString();
    const id = session.id || `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const clean = this.unmapEntity({
      id,
      ...session,
      created_at: now,
      last_accessed_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO user_sessions (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<UserSessionRecord>('SELECT * FROM user_sessions WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as UserSessionRecord;
  }

  public async revokeAllUserSessions(userId: string): Promise<number> {
    const sql = `UPDATE user_sessions SET is_revoked = 1 WHERE user_id = ? AND is_revoked = 0`;
    const res = await this.db.execute(sql, [userId]);
    return res.rowsAffected;
  }

  public async validateApiKey(keyHash: string): Promise<UserApiKey | null> {
    const sql = `SELECT * FROM user_api_keys WHERE key_hash = ? AND is_active = 1 LIMIT 1`;
    const rows = await this.db.query<UserApiKey>(sql, [keyHash]);
    if (rows.length === 0) return null;
    const apiKey = this.mapRow(rows[0]) as unknown as UserApiKey;
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return null;
    }
    await this.db.execute(`UPDATE user_api_keys SET last_used_at = ? WHERE id = ?`, [new Date().toISOString(), apiKey.id]);
    return apiKey;
  }

  public async recordPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    const id = `pwd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    await this.db.execute(
      `INSERT INTO user_password_histories (id, user_id, password_hash, created_at) VALUES (?, ?, ?, ?)`,
      [id, userId, passwordHash, now]
    );
  }

  public async getRecentPasswordHashes(userId: string, limit: number = 5): Promise<string[]> {
    const sql = `SELECT password_hash FROM user_password_histories WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`;
    const rows = await this.db.query<{ password_hash: string }>(sql, [userId, limit]);
    return rows.map(r => r.password_hash);
  }
}
