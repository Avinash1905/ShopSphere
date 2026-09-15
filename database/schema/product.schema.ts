import { TableSchema, SchemaRegistry } from './types.js';

export interface ProductEntity {
  id: string;
  seller_id: string;
  category_id: string;
  brand_id?: string;
  title: string;
  slug: string;
  short_description?: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'OUT_OF_STOCK';
  tags: string[];
  attributes: Record<string, any>;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  thumbnail_url?: string;
  image_urls: string[];
  base_price: number;
  rating_average: number;
  reviews_count: number;
  total_sales_count: number;
  is_featured: boolean;
  published_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export const ProductTableSchema: TableSchema = {
  tableName: 'products',
  description: 'Primary product catalog registry representing physical or digital merchandise items',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    seller_id: {
      name: 'seller_id',
      type: 'UUID',
      isNullable: false,
      description: 'Foreign key to owning seller',
    },
    category_id: {
      name: 'category_id',
      type: 'UUID',
      isNullable: false,
      description: 'Foreign key to assigned category node',
    },
    brand_id: {
      name: 'brand_id',
      type: 'UUID',
      isNullable: true,
      description: 'Optional foreign key to manufacturer brand',
    },
    title: {
      name: 'title',
      type: 'VARCHAR',
      length: 255,
      isNullable: false,
      description: 'Product display title',
    },
    slug: {
      name: 'slug',
      type: 'VARCHAR',
      length: 280,
      isUnique: true,
      isNullable: false,
      description: 'URL-friendly unique slug descriptor',
    },
    short_description: {
      name: 'short_description',
      type: 'VARCHAR',
      length: 500,
      isNullable: true,
    },
    description: {
      name: 'description',
      type: 'TEXT',
      isNullable: false,
    },
    status: {
      name: 'status',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'DRAFT',
      isNullable: false,
      checkConstraint: "status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'OUT_OF_STOCK')",
    },
    tags: {
      name: 'tags',
      type: 'ARRAY',
      defaultValue: [],
      isNullable: false,
      description: 'Searchable keyword tags array',
    },
    attributes: {
      name: 'attributes',
      type: 'JSONB',
      defaultValue: {},
      isNullable: false,
      description: 'Custom key-value attributes (material, dimensions, color palette)',
    },
    seo_title: {
      name: 'seo_title',
      type: 'VARCHAR',
      length: 150,
      isNullable: true,
    },
    seo_description: {
      name: 'seo_description',
      type: 'VARCHAR',
      length: 320,
      isNullable: true,
    },
    seo_keywords: {
      name: 'seo_keywords',
      type: 'ARRAY',
      defaultValue: [],
      isNullable: true,
    },
    thumbnail_url: {
      name: 'thumbnail_url',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
    },
    image_urls: {
      name: 'image_urls',
      type: 'ARRAY',
      defaultValue: [],
      isNullable: false,
    },
    base_price: {
      name: 'base_price',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      isNullable: false,
      defaultValue: 0.0,
      checkConstraint: 'base_price >= 0.0',
    },
    rating_average: {
      name: 'rating_average',
      type: 'DECIMAL',
      precision: 3,
      scale: 2,
      defaultValue: 0.0,
      isNullable: false,
      checkConstraint: 'rating_average >= 0.0 AND rating_average <= 5.0',
    },
    reviews_count: {
      name: 'reviews_count',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    total_sales_count: {
      name: 'total_sales_count',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    is_featured: {
      name: 'is_featured',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    published_at: {
      name: 'published_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
    metadata: {
      name: 'metadata',
      type: 'JSONB',
      defaultValue: {},
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
    deleted_at: {
      name: 'deleted_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
  },
  primaryKey: ['id'],
  foreignKeys: [
    {
      columnName: 'seller_id',
      referencedTable: 'sellers',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
    {
      columnName: 'category_id',
      referencedTable: 'categories',
      referencedColumn: 'id',
      onDelete: 'RESTRICT',
    },
    {
      columnName: 'brand_id',
      referencedTable: 'brands',
      referencedColumn: 'id',
      onDelete: 'SET NULL',
    },
  ],
  indexes: [
    {
      name: 'idx_products_slug_unique',
      columns: ['slug'],
      isUnique: true,
      wherePredicate: 'deleted_at IS NULL',
    },
    {
      name: 'idx_products_seller_status',
      columns: ['seller_id', 'status'],
    },
    {
      name: 'idx_products_category_status',
      columns: ['category_id', 'status'],
    },
    {
      name: 'idx_products_brand_status',
      columns: ['brand_id', 'status'],
    },
    {
      name: 'idx_products_price_rating',
      columns: ['base_price', 'rating_average'],
    },
    {
      name: 'idx_products_search_composite',
      columns: ['status', 'is_featured', 'rating_average', 'total_sales_count'],
    },
  ],
  checks: [
    {
      name: 'chk_products_sales_positive',
      expression: 'total_sales_count >= 0',
    },
    {
      name: 'chk_products_reviews_positive',
      expression: 'reviews_count >= 0',
    },
  ],
  relationships: {
    seller: {
      type: 'MANY_TO_ONE',
      targetTable: 'sellers',
      foreignKey: 'seller_id',
    },
    category: {
      type: 'MANY_TO_ONE',
      targetTable: 'categories',
      foreignKey: 'category_id',
    },
    brand: {
      type: 'MANY_TO_ONE',
      targetTable: 'brands',
      foreignKey: 'brand_id',
    },
    variants: {
      type: 'ONE_TO_MANY',
      targetTable: 'variants',
      foreignKey: 'product_id',
    },
    reviews: {
      type: 'ONE_TO_MANY',
      targetTable: 'reviews',
      foreignKey: 'product_id',
    },
  },
};

SchemaRegistry.register(ProductTableSchema);
