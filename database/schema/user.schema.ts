import { TableSchema, SchemaRegistry } from './types.js';

export interface UserEntity {
  id: string;
  email: string;
  phone_number?: string;
  password_hash: string;
  salt: string;
  first_name: string;
  last_name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  failed_login_attempts: number;
  lockout_until?: string;
  last_login_at?: string;
  last_password_change_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export const UserTableSchema: TableSchema = {
  tableName: 'users',
  description: 'Primary customer, seller, and admin user account records',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
      description: 'Globally unique identifier for user',
    },
    email: {
      name: 'email',
      type: 'VARCHAR',
      length: 255,
      isUnique: true,
      isNullable: false,
      checkConstraint: "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
      description: 'Primary email address used for authentication',
    },
    phone_number: {
      name: 'phone_number',
      type: 'VARCHAR',
      length: 32,
      isUnique: true,
      isNullable: true,
      description: 'E.164 formatted international phone number',
    },
    password_hash: {
      name: 'password_hash',
      type: 'VARCHAR',
      length: 255,
      isNullable: false,
      description: 'Argon2id or bcrypt salted hash',
    },
    salt: {
      name: 'salt',
      type: 'VARCHAR',
      length: 64,
      isNullable: false,
      description: 'Cryptographic salt component',
    },
    first_name: {
      name: 'first_name',
      type: 'VARCHAR',
      length: 100,
      isNullable: false,
      description: 'Given name',
    },
    last_name: {
      name: 'last_name',
      type: 'VARCHAR',
      length: 100,
      isNullable: false,
      description: 'Family name',
    },
    status: {
      name: 'status',
      type: 'VARCHAR',
      length: 32,
      isNullable: false,
      defaultValue: 'PENDING_VERIFICATION',
      checkConstraint: "status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION')",
      description: 'Account state',
    },
    email_verified: {
      name: 'email_verified',
      type: 'BOOLEAN',
      isNullable: false,
      defaultValue: false,
      description: 'Whether email verification has completed',
    },
    phone_verified: {
      name: 'phone_verified',
      type: 'BOOLEAN',
      isNullable: false,
      defaultValue: false,
      description: 'Whether phone SMS OTP verification completed',
    },
    two_factor_enabled: {
      name: 'two_factor_enabled',
      type: 'BOOLEAN',
      isNullable: false,
      defaultValue: false,
      description: 'MFA active status',
    },
    two_factor_secret: {
      name: 'two_factor_secret',
      type: 'VARCHAR',
      length: 128,
      isNullable: true,
      description: 'TOTP encrypted seed secret',
    },
    avatar_url: {
      name: 'avatar_url',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
      description: 'Profile avatar image CDN URL',
    },
    date_of_birth: {
      name: 'date_of_birth',
      type: 'DATE',
      isNullable: true,
      description: 'Birth date for age-restricted items & compliance',
    },
    gender: {
      name: 'gender',
      type: 'VARCHAR',
      length: 32,
      isNullable: true,
      checkConstraint: "gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')",
      description: 'Demographic gender identity',
    },
    failed_login_attempts: {
      name: 'failed_login_attempts',
      type: 'INTEGER',
      isNullable: false,
      defaultValue: 0,
      description: 'Consecutive failed login counter for brute force lockouts',
    },
    lockout_until: {
      name: 'lockout_until',
      type: 'TIMESTAMP',
      isNullable: true,
      description: 'Lockout expiry timestamp if rate limit violated',
    },
    last_login_at: {
      name: 'last_login_at',
      type: 'TIMESTAMP',
      isNullable: true,
      description: 'Last successful authentication time',
    },
    last_password_change_at: {
      name: 'last_password_change_at',
      type: 'TIMESTAMP',
      isNullable: true,
      description: 'Password freshness tracker',
    },
    metadata: {
      name: 'metadata',
      type: 'JSONB',
      isNullable: true,
      defaultValue: {},
      description: 'Flexible JSON attributes and preferences',
    },
    created_at: {
      name: 'created_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
      description: 'Row creation timestamp',
    },
    updated_at: {
      name: 'updated_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
      description: 'Row last updated timestamp',
    },
    deleted_at: {
      name: 'deleted_at',
      type: 'TIMESTAMP',
      isNullable: true,
      description: 'Soft delete tombstone timestamp',
    },
  },
  primaryKey: ['id'],
  foreignKeys: [],
  indexes: [
    {
      name: 'idx_users_email_unique',
      columns: ['email'],
      isUnique: true,
      wherePredicate: 'deleted_at IS NULL',
    },
    {
      name: 'idx_users_phone_unique',
      columns: ['phone_number'],
      isUnique: true,
      wherePredicate: 'deleted_at IS NULL AND phone_number IS NOT NULL',
    },
    {
      name: 'idx_users_status_created',
      columns: ['status', 'created_at'],
      indexType: 'BTREE',
    },
    {
      name: 'idx_users_lockout',
      columns: ['lockout_until'],
      wherePredicate: 'lockout_until IS NOT NULL',
    },
  ],
  checks: [
    {
      name: 'chk_users_failed_attempts_positive',
      expression: 'failed_login_attempts >= 0',
    },
  ],
  relationships: {
    seller: {
      type: 'ONE_TO_ONE',
      targetTable: 'sellers',
      foreignKey: 'user_id',
    },
    roles: {
      type: 'MANY_TO_MANY',
      targetTable: 'roles',
      foreignKey: 'user_id',
      inverseForeignKey: 'role_id',
      junctionTable: 'user_roles',
    },
    addresses: {
      type: 'ONE_TO_MANY',
      targetTable: 'addresses',
      foreignKey: 'user_id',
    },
    orders: {
      type: 'ONE_TO_MANY',
      targetTable: 'orders',
      foreignKey: 'user_id',
    },
    cart: {
      type: 'ONE_TO_ONE',
      targetTable: 'carts',
      foreignKey: 'user_id',
    },
    wishlists: {
      type: 'ONE_TO_MANY',
      targetTable: 'wishlists',
      foreignKey: 'user_id',
    },
    reviews: {
      type: 'ONE_TO_MANY',
      targetTable: 'reviews',
      foreignKey: 'user_id',
    },
    notifications: {
      type: 'ONE_TO_MANY',
      targetTable: 'notifications',
      foreignKey: 'user_id',
    },
    audit_logs: {
      type: 'ONE_TO_MANY',
      targetTable: 'audit_logs',
      foreignKey: 'actor_id',
    },
  },
};

SchemaRegistry.register(UserTableSchema);
