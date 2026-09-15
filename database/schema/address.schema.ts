import { TableSchema, SchemaRegistry } from './types.js';

export interface AddressEntity {
  id: string;
  user_id: string;
  address_type: 'SHIPPING' | 'BILLING' | 'WAREHOUSE' | 'BUSINESS';
  recipient_name: string;
  company_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  phone_number: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  delivery_instructions?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export const AddressTableSchema: TableSchema = {
  tableName: 'addresses',
  description: 'Customer and seller postal addresses for shipping, billing, and fulfillment',
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
    address_type: {
      name: 'address_type',
      type: 'VARCHAR',
      length: 32,
      defaultValue: 'SHIPPING',
      isNullable: false,
      checkConstraint: "address_type IN ('SHIPPING', 'BILLING', 'WAREHOUSE', 'BUSINESS')",
    },
    recipient_name: {
      name: 'recipient_name',
      type: 'VARCHAR',
      length: 150,
      isNullable: false,
    },
    company_name: {
      name: 'company_name',
      type: 'VARCHAR',
      length: 150,
      isNullable: true,
    },
    address_line1: {
      name: 'address_line1',
      type: 'VARCHAR',
      length: 255,
      isNullable: false,
    },
    address_line2: {
      name: 'address_line2',
      type: 'VARCHAR',
      length: 255,
      isNullable: true,
    },
    city: {
      name: 'city',
      type: 'VARCHAR',
      length: 100,
      isNullable: false,
    },
    state_province: {
      name: 'state_province',
      type: 'VARCHAR',
      length: 100,
      isNullable: false,
    },
    postal_code: {
      name: 'postal_code',
      type: 'VARCHAR',
      length: 20,
      isNullable: false,
    },
    country_code: {
      name: 'country_code',
      type: 'VARCHAR',
      length: 2,
      isNullable: false,
      description: 'ISO-3166-1 alpha-2 country code e.g. US, CA, GB',
    },
    phone_number: {
      name: 'phone_number',
      type: 'VARCHAR',
      length: 32,
      isNullable: false,
    },
    is_default_shipping: {
      name: 'is_default_shipping',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    is_default_billing: {
      name: 'is_default_billing',
      type: 'BOOLEAN',
      defaultValue: false,
      isNullable: false,
    },
    delivery_instructions: {
      name: 'delivery_instructions',
      type: 'TEXT',
      isNullable: true,
    },
    latitude: {
      name: 'latitude',
      type: 'DECIMAL',
      precision: 10,
      scale: 7,
      isNullable: true,
    },
    longitude: {
      name: 'longitude',
      type: 'DECIMAL',
      precision: 10,
      scale: 7,
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
      columnName: 'user_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      name: 'idx_addresses_user_id',
      columns: ['user_id'],
    },
    {
      name: 'idx_addresses_defaults',
      columns: ['user_id', 'is_default_shipping', 'is_default_billing'],
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

SchemaRegistry.register(AddressTableSchema);
