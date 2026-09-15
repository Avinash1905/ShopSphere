/**
 * ShopSphere Database Schema - Extended Catalog, Variants, Attributes & Hierarchy Entities
 */
import { TableSchema, SchemaRegistry } from './types.js';

export const ProductAttributesSchema: TableSchema = {
  tableName: 'product_attributes',
  description: 'Dynamic product attribute definitions (e.g., Color, Size, Storage, Material)',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    name: { name: 'name', type: 'VARCHAR', length: 128, isNullable: false },
    code: { name: 'code', type: 'VARCHAR', length: 64, isNullable: false, isUnique: true },
    attribute_type: { name: 'attribute_type', type: 'VARCHAR', length: 32, isNullable: false },
    is_filterable: { name: 'is_filterable', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    is_searchable: { name: 'is_searchable', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    display_order: { name: 'display_order', type: 'INTEGER', isNullable: false, defaultValue: 0 },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [],
  indexes: [
    { name: 'idx_attr_code', columns: ['code'], isUnique: true },
  ],
  checks: [
    { name: 'chk_attr_type', expression: "attribute_type IN ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'COLOR')" },
  ],
  relationships: {},
};

export const ProductAttributeValuesSchema: TableSchema = {
  tableName: 'product_attribute_values',
  description: 'Specific product-level attribute assignments and values',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    product_id: { name: 'product_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    attribute_id: { name: 'attribute_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    text_value: { name: 'text_value', type: 'TEXT', isNullable: true },
    numeric_value: { name: 'numeric_value', type: 'DECIMAL', precision: 12, scale: 4, isNullable: true },
    boolean_value: { name: 'boolean_value', type: 'BOOLEAN', isNullable: true },
    json_value: { name: 'json_value', type: 'JSON', isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'attribute_id', referencedTable: 'product_attributes', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_prod_attr_val_unique', columns: ['product_id', 'attribute_id'], isUnique: true },
  ],
  checks: [],
  relationships: {
    product: { type: 'MANY_TO_ONE', targetTable: 'products', foreignKey: 'product_id' },
    attribute: { type: 'MANY_TO_ONE', targetTable: 'product_attributes', foreignKey: 'attribute_id' },
  },
};

export const ProductMediaGallerySchema: TableSchema = {
  tableName: 'product_media_gallery',
  description: 'Product and variant high-res images, 360 views, videos, and AR models',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    product_id: { name: 'product_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    variant_id: { name: 'variant_id', type: 'VARCHAR', length: 64, isNullable: true, isIndexed: true },
    media_type: { name: 'media_type', type: 'VARCHAR', length: 32, isNullable: false },
    url: { name: 'url', type: 'VARCHAR', length: 512, isNullable: false },
    thumbnail_url: { name: 'thumbnail_url', type: 'VARCHAR', length: 512, isNullable: true },
    alt_text: { name: 'alt_text', type: 'VARCHAR', length: 255, isNullable: true },
    sort_order: { name: 'sort_order', type: 'INTEGER', isNullable: false, defaultValue: 0 },
    is_primary: { name: 'is_primary', type: 'BOOLEAN', isNullable: false, defaultValue: false },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'variant_id', referencedTable: 'variants', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_media_prod_order', columns: ['product_id', 'sort_order'] },
  ],
  checks: [
    { name: 'chk_media_type', expression: "media_type IN ('IMAGE', 'VIDEO', '3D_MODEL', 'DOCUMENT')" },
  ],
  relationships: {
    product: { type: 'MANY_TO_ONE', targetTable: 'products', foreignKey: 'product_id' },
    variant: { type: 'MANY_TO_ONE', targetTable: 'variants', foreignKey: 'variant_id' },
  },
};

export const ProductPricingTiersSchema: TableSchema = {
  tableName: 'product_pricing_tiers',
  description: 'Volume and wholesale pricing breaks per customer group / tier',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    product_id: { name: 'product_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    variant_id: { name: 'variant_id', type: 'VARCHAR', length: 64, isNullable: true, isIndexed: true },
    min_quantity: { name: 'min_quantity', type: 'INTEGER', isNullable: false, defaultValue: 1 },
    unit_price: { name: 'unit_price', type: 'DECIMAL', precision: 12, scale: 2, isNullable: false },
    currency: { name: 'currency', type: 'VARCHAR', length: 3, isNullable: false, defaultValue: 'USD' },
    customer_group: { name: 'customer_group', type: 'VARCHAR', length: 64, isNullable: false, defaultValue: 'DEFAULT' },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'variant_id', referencedTable: 'variants', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_price_tier_qty', columns: ['product_id', 'min_quantity', 'customer_group'] },
  ],
  checks: [
    { name: 'chk_price_tier_min_qty', expression: 'min_quantity >= 1' },
    { name: 'chk_price_tier_positive', expression: 'unit_price >= 0' },
  ],
  relationships: {
    product: { type: 'MANY_TO_ONE', targetTable: 'products', foreignKey: 'product_id' },
    variant: { type: 'MANY_TO_ONE', targetTable: 'variants', foreignKey: 'variant_id' },
  },
};

export const CategoryClosureTableSchema: TableSchema = {
  tableName: 'category_closure_table',
  description: 'High-performance closure table for infinite-depth category hierarchy lookups',
  columns: {
    ancestor_id: { name: 'ancestor_id', type: 'VARCHAR', length: 64, isNullable: false },
    descendant_id: { name: 'descendant_id', type: 'VARCHAR', length: 64, isNullable: false },
    depth: { name: 'depth', type: 'INTEGER', isNullable: false, defaultValue: 0 },
  },
  primaryKey: ['ancestor_id', 'descendant_id'],
  foreignKeys: [
    { columnName: 'ancestor_id', referencedTable: 'categories', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'descendant_id', referencedTable: 'categories', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_closure_descendant', columns: ['descendant_id', 'depth'] },
  ],
  checks: [
    { name: 'chk_closure_depth_pos', expression: 'depth >= 0' },
  ],
  relationships: {
    ancestor: { type: 'MANY_TO_ONE', targetTable: 'categories', foreignKey: 'ancestor_id' },
    descendant: { type: 'MANY_TO_ONE', targetTable: 'categories', foreignKey: 'descendant_id' },
  },
};

export const ProductBundlesSchema: TableSchema = {
  tableName: 'product_bundles',
  description: 'Composite bundle product kits with pricing discounts and component mappings',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    parent_product_id: { name: 'parent_product_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    child_product_id: { name: 'child_product_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    quantity: { name: 'quantity', type: 'INTEGER', isNullable: false, defaultValue: 1 },
    discount_rate: { name: 'discount_rate', type: 'DECIMAL', precision: 5, scale: 2, isNullable: false, defaultValue: 0.00 },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'parent_product_id', referencedTable: 'products', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'child_product_id', referencedTable: 'products', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_bundle_parent_child', columns: ['parent_product_id', 'child_product_id'], isUnique: true },
  ],
  checks: [
    { name: 'chk_bundle_qty', expression: 'quantity >= 1' },
    { name: 'chk_bundle_discount', expression: 'discount_rate >= 0 AND discount_rate <= 100' },
  ],
  relationships: {
    parentProduct: { type: 'MANY_TO_ONE', targetTable: 'products', foreignKey: 'parent_product_id' },
    childProduct: { type: 'MANY_TO_ONE', targetTable: 'products', foreignKey: 'child_product_id' },
  },
};

export const ProductTagsSchema: TableSchema = {
  tableName: 'product_tags',
  description: 'Cross-cutting search tags and SEO categorization labels',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    product_id: { name: 'product_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    tag: { name: 'tag', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_prod_tag_unique', columns: ['product_id', 'tag'], isUnique: true },
  ],
  checks: [],
  relationships: {
    product: { type: 'MANY_TO_ONE', targetTable: 'products', foreignKey: 'product_id' },
  },
};

SchemaRegistry.register(ProductAttributesSchema);
SchemaRegistry.register(ProductAttributeValuesSchema);
SchemaRegistry.register(ProductMediaGallerySchema);
SchemaRegistry.register(ProductPricingTiersSchema);
SchemaRegistry.register(CategoryClosureTableSchema);
SchemaRegistry.register(ProductBundlesSchema);
SchemaRegistry.register(ProductTagsSchema);
