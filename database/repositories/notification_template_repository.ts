/**
 * ShopSphere Database Repositories - Notification Templates, Delivery Logs & Preferences
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface NotificationTemplate {
  id: string;
  template_code: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'WEBHOOK';
  locale: string;
  subject_template?: string;
  body_template: string;
  variables_schema?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationDeliveryLog {
  id: string;
  notification_id: string;
  channel: string;
  provider_name: string;
  provider_message_id?: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'BOUNCED' | 'FAILED';
  error_details?: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
}

export interface UserNotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  updated_at: string;
}

export class NotificationTemplateRepository extends BaseRepository<NotificationTemplate> {
  constructor(db: MigrationDatabaseAdapter) {
    super('notification_templates', db);
  }

  public async getTemplate(templateCode: string, locale: string = 'en_US'): Promise<NotificationTemplate | null> {
    const sql = `
      SELECT * FROM notification_templates
      WHERE template_code = ? AND locale = ? AND is_active = 1
      LIMIT 1
    `;
    const rows = await this.db.query<NotificationTemplate>(sql, [templateCode, locale]);
    if (rows.length > 0) return this.mapRow(rows[0]);

    // Fallback to default en_US if requested locale not found
    if (locale !== 'en_US') {
      const fallbackRows = await this.db.query<NotificationTemplate>(
        'SELECT * FROM notification_templates WHERE template_code = ? AND locale = "en_US" AND is_active = 1 LIMIT 1',
        [templateCode]
      );
      return fallbackRows.length > 0 ? this.mapRow(fallbackRows[0]) : null;
    }

    return null;
  }

  public async logDelivery(log: Omit<NotificationDeliveryLog, 'id' | 'created_at'> & { id?: string }): Promise<NotificationDeliveryLog> {
    const id = log.id || `notiflog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      ...log,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO notification_delivery_logs (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<NotificationDeliveryLog>('SELECT * FROM notification_delivery_logs WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as NotificationDeliveryLog;
  }

  public async getUserPreferences(userId: string, notificationType: string): Promise<UserNotificationPreference | null> {
    const sql = `SELECT * FROM user_notification_preferences WHERE user_id = ? AND notification_type = ? LIMIT 1`;
    const rows = await this.db.query<UserNotificationPreference>(sql, [userId, notificationType]);
    return rows.length > 0 ? (this.mapRow(rows[0]) as unknown as UserNotificationPreference) : null;
  }

  public async updatePreferences(
    userId: string,
    notificationType: string,
    prefs: { email?: boolean; sms?: boolean; push?: boolean; inApp?: boolean }
  ): Promise<UserNotificationPreference> {
    const existing = await this.getUserPreferences(userId, notificationType);
    const now = new Date().toISOString();

    if (existing) {
      const updates: Record<string, any> = { updated_at: now };
      if (prefs.email !== undefined) updates.email_enabled = prefs.email ? 1 : 0;
      if (prefs.sms !== undefined) updates.sms_enabled = prefs.sms ? 1 : 0;
      if (prefs.push !== undefined) updates.push_enabled = prefs.push ? 1 : 0;
      if (prefs.inApp !== undefined) updates.in_app_enabled = prefs.inApp ? 1 : 0;

      const keys = Object.keys(updates);
      const setClauses = keys.map(k => `${k} = ?`).join(', ');
      await this.db.execute(
        `UPDATE user_notification_preferences SET ${setClauses} WHERE id = ?`,
        [...keys.map(k => updates[k]), existing.id]
      );
      const rows = await this.db.query<UserNotificationPreference>('SELECT * FROM user_notification_preferences WHERE id = ?', [existing.id]);
      return this.mapRow(rows[0]) as unknown as UserNotificationPreference;
    } else {
      const id = `pref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const clean = this.unmapEntity({
        id,
        user_id: userId,
        notification_type: notificationType,
        email_enabled: prefs.email !== undefined ? (prefs.email ? 1 : 0) : 1,
        sms_enabled: prefs.sms !== undefined ? (prefs.sms ? 1 : 0) : 0,
        push_enabled: prefs.push !== undefined ? (prefs.push ? 1 : 0) : 1,
        in_app_enabled: prefs.inApp !== undefined ? (prefs.inApp ? 1 : 0) : 1,
        updated_at: now,
      });
      const keys = Object.keys(clean);
      const placeholders = keys.map(() => '?').join(', ');
      await this.db.execute(
        `INSERT INTO user_notification_preferences (${keys.join(', ')}) VALUES (${placeholders})`,
        keys.map(k => clean[k])
      );
      const rows = await this.db.query<UserNotificationPreference>('SELECT * FROM user_notification_preferences WHERE id = ?', [id]);
      return this.mapRow(rows[0]) as unknown as UserNotificationPreference;
    }
  }
}
