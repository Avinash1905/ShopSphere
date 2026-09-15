import { TableSchema, SchemaRegistry } from './types.js';

export interface ReviewEntity {
  id: string;
  product_id: string;
  user_id: string;
  order_item_id?: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  helpful_votes_count: number;
  unhelpful_votes_count: number;
  image_urls: string[];
  seller_reply?: string;
  seller_replied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewVoteEntity {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
}

export const ReviewTableSchema: TableSchema = {
  tableName: 'reviews',
  description: 'Customer product reviews, star ratings, verified purchase flags, and seller replies',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    product_id: {
      name: 'product_id',
      type: 'UUID',
      isNullable: false,
    },
    user_id: {
      name: 'user_id',
      type: 'UUID',
      isNullable: false,
    },
    order_item_id: {
      name: 'order_item_id',
      type: 'UUID',
      isNullable: true,
    },
    rating: {
      name: 'rating',
      type: 'INTEGER',
      isNullable: false,
      checkConstraint: 'rating >= 1 AND rating <= 5',
      description: 'Integer star rating between 1 and 5',
    },
    title: {
      name: 'title',
      type: 'VARCHAR',
      length: 150,
      isNullable: false,
    },
    comment: {
      name: 'comment',
      type: 'TEXT',
      isNullable: false,
    },
    is_verified_purchase: {
      name: 'is_verified_purchase',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    status: {
      name: 'status',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'APPROVED',
      isNullable: false,
      checkConstraint: "status IN ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED')",
    },
    helpful_votes_count: {
      name: 'helpful_votes_count',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    unhelpful_votes_count: {
      name: 'unhelpful_votes_count',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    image_urls: {
      name: 'image_urls',
      type: 'ARRAY',
      defaultValue: [],
      isNullable: false,
    },
    seller_reply: {
      name: 'seller_reply',
      type: 'TEXT',
      isNullable: true,
    },
    seller_replied_at: {
      name: 'seller_replied_at',
      type: 'TIMESTAMP',
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
      columnName: 'product_id',
      referencedTable: 'products',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'user_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'order_item_id',
      referencedTable: 'order_items',
      referencedColumn: 'id',
      onDelete: 'SET NULL',
    },
  ],
  indexes: [
    {
      name: 'idx_reviews_product_rating',
      columns: ['product_id', 'rating', 'status'],
    },
    {
      name: 'idx_reviews_user_product_unique',
      columns: ['user_id', 'product_id'],
      isUnique: true,
    },
    {
      name: 'idx_reviews_created',
      columns: ['created_at'],
    },
  ],
  checks: [
    {
      name: 'chk_reviews_rating_range',
      expression: 'rating >= 1 AND rating <= 5',
    },
    {
      name: 'chk_reviews_helpful_votes_positive',
      expression: 'helpful_votes_count >= 0 AND unhelpful_votes_count >= 0',
    },
  ],
  relationships: {
    product: {
      type: 'MANY_TO_ONE',
      targetTable: 'products',
      foreignKey: 'product_id',
    },
    user: {
      type: 'MANY_TO_ONE',
      targetTable: 'users',
      foreignKey: 'user_id',
    },
  },
};

export const ReviewVoteTableSchema: TableSchema = {
  tableName: 'review_votes',
  description: 'Upvotes and downvotes on reviews by customers',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    review_id: {
      name: 'review_id',
      type: 'UUID',
      isNullable: false,
    },
    user_id: {
      name: 'user_id',
      type: 'UUID',
      isNullable: false,
    },
    is_helpful: {
      name: 'is_helpful',
      type: 'BOOLEAN',
      isNullable: false,
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
      columnName: 'review_id',
      referencedTable: 'reviews',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
    {
      columnName: 'user_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      name: 'idx_review_votes_unique',
      columns: ['review_id', 'user_id'],
      isUnique: true,
    },
  ],
  checks: [],
  relationships: {},
};

SchemaRegistry.register(ReviewTableSchema);
SchemaRegistry.register(ReviewVoteTableSchema);
