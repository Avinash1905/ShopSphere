import { TableSchema, SchemaRegistry } from './types.js';

export interface RoleEntity {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_system_role: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface PermissionEntity {
  id: string;
  module: string;
  action: string;
  code: string;
  description?: string;
  is_system_permission: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermissionEntity {
  role_id: string;
  permission_id: string;
  granted_at: string;
  granted_by?: string;
}

export interface UserRoleEntity {
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by?: string;
}

export const RoleTableSchema: TableSchema = {
  tableName: 'roles',
  description: 'RBAC user roles with system hierarchy and priority levels',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    name: {
      name: 'name',
      type: 'VARCHAR',
      length: 100,
      isNullable: false,
    },
    code: {
      name: 'code',
      type: 'VARCHAR',
      length: 64,
      isUnique: true,
      isNullable: false,
    },
    description: {
      name: 'description',
      type: 'TEXT',
      isNullable: true,
    },
    is_system_role: {
      name: 'is_system_role',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    priority: {
      name: 'priority',
      type: 'INTEGER',
      defaultValue: 100,
      isNullable: false,
      description: 'Numeric priority for conflict resolution; lower number = higher privilege',
    },
    created_at: {
      name: 'created_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      name: 'updated_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  primaryKey: ['id'],
  foreignKeys: [],
  indexes: [
    {
      name: 'idx_roles_code_unique',
      columns: ['code'],
      isUnique: true,
    },
    {
      name: 'idx_roles_priority',
      columns: ['priority'],
    },
  ],
  checks: [
    {
      name: 'chk_roles_priority_positive',
      expression: 'priority >= 0',
    },
  ],
  relationships: {
    permissions: {
      type: 'MANY_TO_MANY',
      targetTable: 'permissions',
      foreignKey: 'role_id',
      inverseForeignKey: 'permission_id',
      junctionTable: 'role_permissions',
    },
    users: {
      type: 'MANY_TO_MANY',
      targetTable: 'users',
      foreignKey: 'role_id',
      inverseForeignKey: 'user_id',
      junctionTable: 'user_roles',
    },
  },
};

export const PermissionTableSchema: TableSchema = {
  tableName: 'permissions',
  description: 'Granular resource actions that can be bound to roles and policies',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    module: {
      name: 'module',
      type: 'VARCHAR',
      length: 64,
      isNullable: false,
      description: 'Domain module name: products, orders, users, analytics, audit, etc.',
    },
    action: {
      name: 'action',
      type: 'VARCHAR',
      length: 64,
      isNullable: false,
      description: 'CRUD action: read, create, update, delete, export, approve, refund',
    },
    code: {
      name: 'code',
      type: 'VARCHAR',
      length: 128,
      isUnique: true,
      isNullable: false,
      description: 'Canonical permission identifier e.g. products:create, orders:refund',
    },
    description: {
      name: 'description',
      type: 'TEXT',
      isNullable: true,
    },
    is_system_permission: {
      name: 'is_system_permission',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    created_at: {
      name: 'created_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      name: 'updated_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  primaryKey: ['id'],
  foreignKeys: [],
  indexes: [
    {
      name: 'idx_permissions_code_unique',
      columns: ['code'],
      isUnique: true,
    },
    {
      name: 'idx_permissions_module_action',
      columns: ['module', 'action'],
    },
  ],
  checks: [],
  relationships: {
    roles: {
      type: 'MANY_TO_MANY',
      targetTable: 'roles',
      foreignKey: 'permission_id',
      inverseForeignKey: 'role_id',
      junctionTable: 'role_permissions',
    },
  },
};

export const RolePermissionTableSchema: TableSchema = {
  tableName: 'role_permissions',
  description: 'Junction table linking Roles to Permissions',
  columns: {
    role_id: {
      name: 'role_id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    permission_id: {
      name: 'permission_id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    granted_at: {
      name: 'granted_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
    granted_by: {
      name: 'granted_by',
      type: 'UUID',
      isNullable: true,
    },
  },
  primaryKey: ['role_id', 'permission_id'],
  foreignKeys: [
    {
      columnName: 'role_id',
      referencedTable: 'roles',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'permission_id',
      referencedTable: 'permissions',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'granted_by',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'SET NULL',
    },
  ],
  indexes: [
    {
      name: 'idx_role_permissions_perm_role',
      columns: ['permission_id', 'role_id'],
    },
  ],
  checks: [],
  relationships: {},
};

export const UserRoleTableSchema: TableSchema = {
  tableName: 'user_roles',
  description: 'Junction table assigning Roles to Users',
  columns: {
    user_id: {
      name: 'user_id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    role_id: {
      name: 'role_id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    assigned_at: {
      name: 'assigned_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
    assigned_by: {
      name: 'assigned_by',
      type: 'UUID',
      isNullable: true,
    },
  },
  primaryKey: ['user_id', 'role_id'],
  foreignKeys: [
    {
      columnName: 'user_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'role_id',
      referencedTable: 'roles',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'assigned_by',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'SET NULL',
    },
  ],
  indexes: [
    {
      name: 'idx_user_roles_role_user',
      columns: ['role_id', 'user_id'],
    },
  ],
  checks: [],
  relationships: {},
};

SchemaRegistry.register(RoleTableSchema);
SchemaRegistry.register(PermissionTableSchema);
SchemaRegistry.register(RolePermissionTableSchema);
SchemaRegistry.register(UserRoleTableSchema);
