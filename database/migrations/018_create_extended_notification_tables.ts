import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration018CreateExtendedNotificationTables: MigrationStep = {
  name: '018_create_extended_notification_tables',
  version: '20260915000018',
  description: 'Create notification templates, delivery logs, and user channel preferences tables',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id VARCHAR(64) PRIMARY KEY,
        template_code VARCHAR(64) NOT NULL UNIQUE,
        channel VARCHAR(32) NOT NULL,
        locale VARCHAR(16) NOT NULL DEFAULT 'en_US',
        subject_template VARCHAR(255),
        body_template TEXT NOT NULL,
        variables_schema JSON,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS notification_delivery_logs (
        id VARCHAR(64) PRIMARY KEY,
        notification_id VARCHAR(64) NOT NULL,
        channel VARCHAR(32) NOT NULL,
        provider_name VARCHAR(64) NOT NULL,
        provider_message_id VARCHAR(255),
        status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
        error_details TEXT,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        notification_type VARCHAR(64) NOT NULL,
        email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS user_notification_preferences;');
    await db.execute('DROP TABLE IF EXISTS notification_delivery_logs;');
    await db.execute('DROP TABLE IF EXISTS notification_templates;');
  },
};
