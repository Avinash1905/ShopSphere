import { TableSchema, SchemaRegistry } from './types.js';

export interface CategoryEntity {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon?: string;
  depth_level: number;
  hierarchy_path: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BrandEntity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  is_verified: boolean;
  is_active: boolean;
  country_of_origin?: string;
  created_at: string;
  updated_at: string;
}

export const CategoryTableSchema: TableSchema = {
  tableName: 'categories',
  description: 'Hierarchical product category taxonomy tree',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    parent_id: {
      name: 'parent_id',
      type: 'UUID',
      isNullable: true,
      description: 'Parent category ID for tree structure',
    },
    name: {
      name: 'name',
      type: 'VARCHAR',
      length: 120,
      isNullable: false,
    },
    slug: {
      name: 'slug',
      type: 'VARCHAR',
      length: 150,
      isUnique: true,
      isNullable: false,
    },
    description: {
      name: 'description',
      type: 'TEXT',
      isNullable: true,
    },
    image_url: {
      name: 'image_url',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
    },
    icon: {
      name: 'icon',
      type: 'VARCHAR',
      length: 64,
      isNullable: true,
    },
    depth_level: {
      name: 'depth_level',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    hierarchy_path: {
      name: 'hierarchy_path',
      type: 'VARCHAR',
      length: 512,
      defaultValue: '/',
      isNullable: false,
      description: 'Materialized path e.g. /electronics/computers/laptops',
    },
    is_active: {
      name: 'is_active',
      type: 'BOOLEAN',
      defaultValue: true,
      isNullable: false,
    },
    display_order: {
      name: 'display_order',
      type: 'INTEGER',
      defaultValue: 0,
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
  foreignKeys: [
    {
      columnName: 'parent_id',
      referencedTable: 'categories',
      referencedColumn: 'id',
      onDelete: 'SET NULL',
    },
  ],
  indexes: [
    {
      name: 'idx_categories_slug_unique',
      columns: ['slug'],
      isUnique: true,
    },
    {
      name: 'idx_categories_parent_order',
      columns: ['parent_id', 'display_order'],
    },
    {
      name: 'idx_categories_path',
      columns: ['hierarchy_path'],
    },
  ],
  checks: [
    {
      name: 'chk_categories_depth_positive',
      expression: 'depth_level >= 0',
    },
  ],
  relationships: {
    parent: {
      type: 'MANY_TO_ONE',
      targetTable: 'categories',
      foreignKey: 'parent_id',
    },
    children: {
      type: 'ONE_TO_MANY',
      targetTable: 'categories',
      foreignKey: 'parent_id',
    },
    products: {
      type: 'ONE_TO_MANY',
      targetTable: 'products',
      foreignKey: 'category_id',
    },
  },
};

export const BrandTableSchema: TableSchema = {
  tableName: 'brands',
  description: 'Manufacturer brand profiles and brand metadata',
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
      length: 120,
      isNullable: false,
    },
    slug: {
      name: 'slug',
      type: 'VARCHAR',
      length: 150,
      isUnique: true,
      isNullable: false,
    },
    description: {
      name: 'description',
      type: 'TEXT',
      isNullable: true,
    },
    logo_url: {
      name: 'logo_url',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
    },
    website_url: {
      name: 'website_url',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
    },
    is_verified: {
      name: 'is_verified',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    is_active: {
      name: 'is_active',
      type: 'BOOLEAN',
      defaultValue: true,
      isNullable: false,
    },
    country_of_origin: {
      name: 'country_of_origin',
      type: 'VARCHAR',
      length: 64,
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
  foreignKeys: [],
  indexes: [
    {
      name: 'idx_brands_slug_unique',
      columns: ['slug'],
      isUnique: true,
    },
    {
      name: 'idx_brands_active_verified',
      columns: ['is_active', 'is_verified'],
    },
  ],
  checks: [],
  relationships: {
    products: {
      type: 'ONE_TO_MANY',
      targetTable: 'products',
      foreignKey: 'brand_id',
    },
  },
};

SchemaRegistry.register(CategoryTableSchema);
SchemaRegistry.register(BrandTableSchema);
