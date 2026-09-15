import { TableSchema, SchemaRegistry } from './types.js';

export interface NotificationEntity {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'ORDER_UPDATE' | 'PAYMENT_CONFIRMATION' | 'PROMOTION' | 'SECURITY_ALERT' | 'INVENTORY_ALERT' | 'SYSTEM';
  delivery_channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  created_at: string;
}

export const NotificationTableSchema: TableSchema = {
  tableName: 'notifications',
  description: 'In-app and omnichannel user notifications with delivery state and read tracking',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    user_id: {
      name: 'user_id',
      type: 'UUID',
      isNullable: false,
    },
    title: {
      name: 'title',
      type: 'VARCHAR',
      length: 200,
      isNullable: false,
    },
    message: {
      name: 'message',
      type: 'TEXT',
      isNullable: false,
    },
    notification_type: {
      name: 'notification_type',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'SYSTEM',
      isNullable: false,
      checkConstraint: "notification_type IN ('ORDER_UPDATE', 'PAYMENT_CONFIRMATION', 'PROMOTION', 'SECURITY_ALERT', 'INVENTORY_ALERT', 'SYSTEM')",
    },
    delivery_channel: {
      name: 'delivery_channel',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'IN_APP',
      isNullable: false,
      checkConstraint: "delivery_channel IN ('IN_APP', 'EMAIL', 'SMS', 'PUSH')",
    },
    priority: {
      name: 'priority',
      type: 'VARCHAR',
      length: 16,
      defaultValue: 'NORMAL',
      isNullable: false,
      checkConstraint: "priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')",
    },
    is_read: {
      name: 'is_read',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    read_at: {
      name: 'read_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
    action_url: {
      name: 'action_url',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
    },
    metadata: {
      name: 'metadata',
      type: 'JSONB',
      defaultValue: {},
      isNullable: true,
    },
    expires_at: {
      name: 'expires_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
    created_at: {
      name: 'created_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  primaryKey: ['id'],
  foreignKeys: [
    {
      columnName: 'user_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      name: 'idx_notifications_user_read',
      columns: ['user_id', 'is_read', 'created_at'],
    },
    {
      name: 'idx_notifications_priority',
      columns: ['priority', 'created_at'],
    },
  ],
  checks: [],
  relationships: {
    user: {
      type: 'MANY_TO_ONE',
      targetTable: 'users',
      foreignKey: 'user_id',
    },
  },
};

SchemaRegistry.register(NotificationTableSchema);
