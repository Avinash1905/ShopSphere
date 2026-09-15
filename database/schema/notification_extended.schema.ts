/**
 * ShopSphere Database Schema - Extended Multi-Channel Notifications & Preferences
 */
import { TableSchema, SchemaRegistry } from './types.js';

export const NotificationTemplatesSchema: TableSchema = {
  tableName: 'notification_templates',
  description: 'Multi-lingual email, SMS, and push notification markdown/HTML templates',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    template_code: { name: 'template_code', type: 'VARCHAR', length: 64, isNullable: false, isUnique: true },
    channel: { name: 'channel', type: 'VARCHAR', length: 32, isNullable: false },
    locale: { name: 'locale', type: 'VARCHAR', length: 16, isNullable: false, defaultValue: 'en_US' },
    subject_template: { name: 'subject_template', type: 'VARCHAR', length: 255, isNullable: true },
    body_template: { name: 'body_template', type: 'TEXT', isNullable: false },
    variables_schema: { name: 'variables_schema', type: 'JSON', isNullable: true },
    is_active: { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { name: 'updated_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [],
  indexes: [
    { name: 'idx_tpl_code_locale_channel', columns: ['template_code', 'locale', 'channel'], isUnique: true },
  ],
  checks: [
    { name: 'chk_tpl_channel', expression: "channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WEBHOOK')" },
  ],
  relationships: {},
};

export const NotificationDeliveryLogsSchema: TableSchema = {
  tableName: 'notification_delivery_logs',
  description: 'Carrier provider delivery receipts, open tracking, and bounce reports',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    notification_id: { name: 'notification_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    channel: { name: 'channel', type: 'VARCHAR', length: 32, isNullable: false },
    provider_name: { name: 'provider_name', type: 'VARCHAR', length: 64, isNullable: false },
    provider_message_id: { name: 'provider_message_id', type: 'VARCHAR', length: 255, isNullable: true },
    status: { name: 'status', type: 'VARCHAR', length: 32, isNullable: false, defaultValue: 'QUEUED' },
    error_details: { name: 'error_details', type: 'TEXT', isNullable: true },
    opened_at: { name: 'opened_at', type: 'TIMESTAMP', isNullable: true },
    clicked_at: { name: 'clicked_at', type: 'TIMESTAMP', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'notification_id', referencedTable: 'notifications', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_deliv_notif_status', columns: ['notification_id', 'status'] },
  ],
  checks: [
    { name: 'chk_deliv_status', expression: "status IN ('QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'BOUNCED', 'FAILED')" },
  ],
  relationships: {
    notification: { type: 'MANY_TO_ONE', targetTable: 'notifications', foreignKey: 'notification_id' },
  },
};

export const UserNotificationPreferencesSchema: TableSchema = {
  tableName: 'user_notification_preferences',
  description: 'Granular user channel opt-ins and marketing quiet hour rules',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    notification_type: { name: 'notification_type', type: 'VARCHAR', length: 64, isNullable: false },
    email_enabled: { name: 'email_enabled', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    sms_enabled: { name: 'sms_enabled', type: 'BOOLEAN', isNullable: false, defaultValue: false },
    push_enabled: { name: 'push_enabled', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    in_app_enabled: { name: 'in_app_enabled', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    updated_at: { name: 'updated_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_user_pref_unique', columns: ['user_id', 'notification_type'], isUnique: true },
  ],
  checks: [],
  relationships: {
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

SchemaRegistry.register(NotificationTemplatesSchema);
SchemaRegistry.register(NotificationDeliveryLogsSchema);
SchemaRegistry.register(UserNotificationPreferencesSchema);
