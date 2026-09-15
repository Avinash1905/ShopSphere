import { TableSchema, SchemaRegistry } from './types.js';

export interface WishlistEntity {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  share_token?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistItemEntity {
  id: string;
  wishlist_id: string;
  product_id: string;
  variant_id?: string;
  priority: number;
  notes?: string;
  added_at: string;
}

export const WishlistTableSchema: TableSchema = {
  tableName: 'wishlists',
  description: 'Customer saved wishlists and shared gift registries',
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
    name: {
      name: 'name',
      type: 'VARCHAR',
      length: 100,
      defaultValue: 'My Wishlist',
      isNullable: false,
    },
    is_public: {
      name: 'is_public',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    share_token: {
      name: 'share_token',
      type: 'VARCHAR',
      length: 64,
      isUnique: true,
      isNullable: true,
    },
    description: {
      name: 'description',
      type: 'TEXT',
      isNullable: true,
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
      name: 'idx_wishlists_user_id',
      columns: ['user_id'],
    },
    {
      name: 'idx_wishlists_share_token',
      columns: ['share_token'],
      wherePredicate: 'share_token IS NOT NULL',
    },
  ],
  checks: [],
  relationships: {
    user: {
      type: 'MANY_TO_ONE',
      targetTable: 'users',
      foreignKey: 'user_id',
    },
    items: {
      type: 'ONE_TO_MANY',
      targetTable: 'wishlist_items',
      foreignKey: 'wishlist_id',
    },
  },
};

export const WishlistItemTableSchema: TableSchema = {
  tableName: 'wishlist_items',
  description: 'Individual items saved within customer wishlists',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    wishlist_id: {
      name: 'wishlist_id',
      type: 'UUID',
      isNullable: false,
    },
    product_id: {
      name: 'product_id',
      type: 'UUID',
      isNullable: false,
    },
    variant_id: {
      name: 'variant_id',
      type: 'UUID',
      isNullable: true,
    },
    priority: {
      name: 'priority',
      type: 'INTEGER',
      defaultValue: 1,
      isNullable: false,
    },
    notes: {
      name: 'notes',
      type: 'VARCHAR',
      length: 255,
      isNullable: true,
    },
    added_at: {
      name: 'added_at',
      type: 'TIMESTAMP',
      isNullable: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  primaryKey: ['id'],
  foreignKeys: [
    {
      columnName: 'wishlist_id',
      referencedTable: 'wishlists',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'product_id',
      referencedTable: 'products',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'variant_id',
      referencedTable: 'variants',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      name: 'idx_wishlist_items_unique_item',
      columns: ['wishlist_id', 'product_id'],
      isUnique: true,
    },
  ],
  checks: [],
  relationships: {
    wishlist: {
      type: 'MANY_TO_ONE',
      targetTable: 'wishlists',
      foreignKey: 'wishlist_id',
    },
    product: {
      type: 'MANY_TO_ONE',
      targetTable: 'products',
      foreignKey: 'product_id',
    },
  },
};

SchemaRegistry.register(WishlistTableSchema);
SchemaRegistry.register(WishlistItemTableSchema);
