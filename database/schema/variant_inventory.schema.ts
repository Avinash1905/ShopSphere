import { TableSchema, SchemaRegistry } from './types.js';

export interface ProductVariantEntity {
  id: string;
  product_id: string;
  sku: string;
  barcode?: string;
  title: string;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  option3_name?: string;
  option3_value?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  weight_grams?: number;
  dimensions_cm?: {
    length: number;
    width: number;
    height: number;
  };
  image_url?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  display_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface InventoryEntity {
  id: string;
  variant_id: string;
  warehouse_location: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  safety_stock_threshold: number;
  reorder_point: number;
  reorder_quantity: number;
  allow_backorder: boolean;
  restock_expected_at?: string;
  last_counted_at?: string;
  version_lock: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovementEntity {
  id: string;
  inventory_id: string;
  variant_id: string;
  movement_type: 'PURCHASE_RECEIPT' | 'ORDER_RESERVATION' | 'ORDER_FULFILLMENT' | 'ORDER_CANCELLATION' | 'RETURN_RESTOCK' | 'MANUAL_ADJUSTMENT' | 'AUDIT_WRITE_OFF';
  quantity_delta: number;
  balance_after: number;
  reference_type?: 'ORDER' | 'PURCHASE_ORDER' | 'RETURN' | 'MANUAL';
  reference_id?: string;
  notes?: string;
  performed_by?: string;
  created_at: string;
}

export const VariantTableSchema: TableSchema = {
  tableName: 'variants',
  description: 'SKU-level product variants including dimensions, attributes, and unit pricing',
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
    sku: {
      name: 'sku',
      type: 'VARCHAR',
      length: 100,
      isUnique: true,
      isNullable: false,
    },
    barcode: {
      name: 'barcode',
      type: 'VARCHAR',
      length: 64,
      isUnique: true,
      isNullable: true,
    },
    title: {
      name: 'title',
      type: 'VARCHAR',
      length: 200,
      isNullable: false,
    },
    option1_name: {
      name: 'option1_name',
      type: 'VARCHAR',
      length: 50,
      isNullable: true,
    },
    option1_value: {
      name: 'option1_value',
      type: 'VARCHAR',
      length: 100,
      isNullable: true,
    },
    option2_name: {
      name: 'option2_name',
      type: 'VARCHAR',
      length: 50,
      isNullable: true,
    },
    option2_value: {
      name: 'option2_value',
      type: 'VARCHAR',
      length: 100,
      isNullable: true,
    },
    option3_name: {
      name: 'option3_name',
      type: 'VARCHAR',
      length: 50,
      isNullable: true,
    },
    option3_value: {
      name: 'option3_value',
      type: 'VARCHAR',
      length: 100,
      isNullable: true,
    },
    price: {
      name: 'price',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      isNullable: false,
      checkConstraint: 'price >= 0.0',
    },
    compare_at_price: {
      name: 'compare_at_price',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      isNullable: true,
    },
    cost_price: {
      name: 'cost_price',
      type: 'DECIMAL',
      precision: 12,
      scale: 2,
      isNullable: true,
    },
    weight_grams: {
      name: 'weight_grams',
      type: 'INTEGER',
      isNullable: true,
    },
    dimensions_cm: {
      name: 'dimensions_cm',
      type: 'JSONB',
      isNullable: true,
    },
    image_url: {
      name: 'image_url',
      type: 'VARCHAR',
      length: 512,
      isNullable: true,
    },
    status: {
      name: 'status',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'ACTIVE',
      isNullable: false,
      checkConstraint: "status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED')",
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
    deleted_at: {
      name: 'deleted_at',
      type: 'TIMESTAMP',
      isNullable: true,
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
  ],
  indexes: [
    {
      name: 'idx_variants_sku_unique',
      columns: ['sku'],
      isUnique: true,
    },
    {
      name: 'idx_variants_product_id',
      columns: ['product_id'],
    },
    {
      name: 'idx_variants_barcode',
      columns: ['barcode'],
      wherePredicate: 'barcode IS NOT NULL',
    },
  ],
  checks: [
    {
      name: 'chk_variants_price_positive',
      expression: 'price >= 0.0',
    },
  ],
  relationships: {
    product: {
      type: 'MANY_TO_ONE',
      targetTable: 'products',
      foreignKey: 'product_id',
    },
    inventory: {
      type: 'ONE_TO_ONE',
      targetTable: 'inventory',
      foreignKey: 'variant_id',
    },
  },
};

export const InventoryTableSchema: TableSchema = {
  tableName: 'inventory',
  description: 'Physical stock levels, reservation states, safety thresholds, and optimistic locks',
  columns: {
    id: {
      name: 'id',
      type: 'UUID',
      isPrimary: true,
      isNullable: false,
    },
    variant_id: {
      name: 'variant_id',
      type: 'UUID',
      isUnique: true,
      isNullable: false,
    },
    warehouse_location: {
      name: 'warehouse_location',
      type: 'VARCHAR',
      length: 100,
      defaultValue: 'MAIN_DC',
      isNullable: false,
    },
    quantity_on_hand: {
      name: 'quantity_on_hand',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    quantity_reserved: {
      name: 'quantity_reserved',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    quantity_available: {
      name: 'quantity_available',
      type: 'INTEGER',
      defaultValue: 0,
      isNullable: false,
    },
    safety_stock_threshold: {
      name: 'safety_stock_threshold',
      type: 'INTEGER',
      defaultValue: 5,
      isNullable: false,
    },
    reorder_point: {
      name: 'reorder_point',
      type: 'INTEGER',
      defaultValue: 10,
      isNullable: false,
    },
    reorder_quantity: {
      name: 'reorder_quantity',
      type: 'INTEGER',
      defaultValue: 50,
      isNullable: false,
    },
    allow_backorder: {
      name: 'allow_backorder',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    restock_expected_at: {
      name: 'restock_expected_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
    last_counted_at: {
      name: 'last_counted_at',
      type: 'TIMESTAMP',
      isNullable: true,
    },
    version_lock: {
      name: 'version_lock',
      type: 'INTEGER',
      defaultValue: 1,
      isNullable: false,
      description: 'Optimistic locking version tag for concurrency handling',
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
      columnName: 'variant_id',
      referencedTable: 'variants',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      name: 'idx_inventory_variant_unique',
      columns: ['variant_id'],
      isUnique: true,
    },
    {
      name: 'idx_inventory_available',
      columns: ['quantity_available', 'allow_backorder'],
    },
  ],
  checks: [
    {
      name: 'chk_inventory_on_hand_non_negative',
      expression: 'quantity_on_hand >= 0',
    },
    {
      name: 'chk_inventory_reserved_non_negative',
      expression: 'quantity_reserved >= 0',
    },
  ],
  relationships: {
    variant: {
      type: 'ONE_TO_ONE',
      targetTable: 'variants',
      foreignKey: 'variant_id',
    },
  },
};

SchemaRegistry.register(VariantTableSchema);
SchemaRegistry.register(InventoryTableSchema);
