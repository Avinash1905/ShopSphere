/**
 * ShopSphere Database Schema - Extended Customer Reviews, Media, Cart Abandonment & Engagement
 */
import { TableSchema, SchemaRegistry } from './types.js';

export const ReviewMediaSchema: TableSchema = {
  tableName: 'review_media',
  description: 'Customer uploaded photo and video reviews verifying received product condition',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    review_id: { name: 'review_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    media_type: { name: 'media_type', type: 'VARCHAR', length: 32, isNullable: false },
    url: { name: 'url', type: 'VARCHAR', length: 512, isNullable: false },
    thumbnail_url: { name: 'thumbnail_url', type: 'VARCHAR', length: 512, isNullable: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'review_id', referencedTable: 'reviews', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_review_media_rev', columns: ['review_id'] },
  ],
  checks: [
    { name: 'chk_rev_media_type', expression: "media_type IN ('IMAGE', 'VIDEO')" },
  ],
  relationships: {
    review: { type: 'MANY_TO_ONE', targetTable: 'reviews', foreignKey: 'review_id' },
  },
};

export const ReviewHelpfulVotesSchema: TableSchema = {
  tableName: 'review_helpful_votes',
  description: 'Customer upvotes / downvotes on product reviews',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    review_id: { name: 'review_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    is_helpful: { name: 'is_helpful', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'review_id', referencedTable: 'reviews', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_review_vote_unique', columns: ['review_id', 'user_id'], isUnique: true },
  ],
  checks: [],
  relationships: {
    review: { type: 'MANY_TO_ONE', targetTable: 'reviews', foreignKey: 'review_id' },
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

export const ReviewSellerResponsesSchema: TableSchema = {
  tableName: 'review_seller_responses',
  description: 'Merchant public replies to customer reviews with moderation flag',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    review_id: { name: 'review_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true, isUnique: true },
    seller_id: { name: 'seller_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    response_text: { name: 'response_text', type: 'TEXT', isNullable: false },
    is_approved: { name: 'is_approved', type: 'BOOLEAN', isNullable: false, defaultValue: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { name: 'updated_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'review_id', referencedTable: 'reviews', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'seller_id', referencedTable: 'sellers', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_rev_resp_unique', columns: ['review_id'], isUnique: true },
  ],
  checks: [],
  relationships: {
    review: { type: 'MANY_TO_ONE', targetTable: 'reviews', foreignKey: 'review_id' },
    seller: { type: 'MANY_TO_ONE', targetTable: 'sellers', foreignKey: 'seller_id' },
  },
};

export const CartAbandonmentLogsSchema: TableSchema = {
  tableName: 'cart_abandonment_logs',
  description: 'Tracks abandoned user carts for re-engagement discount workflows',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    cart_id: { name: 'cart_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: true, isIndexed: true },
    cart_total_value: { name: 'cart_total_value', type: 'DECIMAL', precision: 12, scale: 2, isNullable: false },
    item_count: { name: 'item_count', type: 'INTEGER', isNullable: false },
    abandoned_at: { name: 'abandoned_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    recovery_email_sent_at: { name: 'recovery_email_sent_at', type: 'TIMESTAMP', isNullable: true },
    is_recovered: { name: 'is_recovered', type: 'BOOLEAN', isNullable: false, defaultValue: false },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'cart_id', referencedTable: 'carts', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'SET NULL' },
  ],
  indexes: [
    { name: 'idx_cart_aban_time', columns: ['abandoned_at', 'is_recovered'] },
  ],
  checks: [
    { name: 'chk_cart_val_pos', expression: 'cart_total_value >= 0' },
  ],
  relationships: {
    cart: { type: 'MANY_TO_ONE', targetTable: 'carts', foreignKey: 'cart_id' },
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
  },
};

export const SavedForLaterItemsSchema: TableSchema = {
  tableName: 'saved_for_later_items',
  description: 'Items moved from active shopping cart into saved-for-later shelf',
  columns: {
    id: { name: 'id', type: 'VARCHAR', length: 64, isPrimary: true, isNullable: false },
    user_id: { name: 'user_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    product_id: { name: 'product_id', type: 'VARCHAR', length: 64, isNullable: false, isIndexed: true },
    variant_id: { name: 'variant_id', type: 'VARCHAR', length: 64, isNullable: true, isIndexed: true },
    created_at: { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  },
  primaryKey: ['id'],
  foreignKeys: [
    { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id', onDelete: 'CASCADE' },
    { columnName: 'variant_id', referencedTable: 'variants', referencedColumn: 'id', onDelete: 'CASCADE' },
  ],
  indexes: [
    { name: 'idx_saved_item_user_prod', columns: ['user_id', 'product_id', 'variant_id'] },
  ],
  checks: [],
  relationships: {
    user: { type: 'MANY_TO_ONE', targetTable: 'users', foreignKey: 'user_id' },
    product: { type: 'MANY_TO_ONE', targetTable: 'products', foreignKey: 'product_id' },
    variant: { type: 'MANY_TO_ONE', targetTable: 'variants', foreignKey: 'variant_id' },
  },
};

SchemaRegistry.register(ReviewMediaSchema);
SchemaRegistry.register(ReviewHelpfulVotesSchema);
SchemaRegistry.register(ReviewSellerResponsesSchema);
SchemaRegistry.register(CartAbandonmentLogsSchema);
SchemaRegistry.register(SavedForLaterItemsSchema);
