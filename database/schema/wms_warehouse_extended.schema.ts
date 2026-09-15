export interface WarehouseZoneTable {
  id: string; // UUID
  warehouse_id: string; // FK -> warehouses.id
  zone_code: string; // e.g. 'ZONE-A-COLD', 'ZONE-B-FAST'
  zone_name: string;
  zone_type: 'AMBIENT' | 'REFRIGERATED' | 'HAZARDOUS' | 'HIGH_VALUE_VAULT' | 'BULK_STORAGE';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseBinTable {
  id: string; // UUID
  warehouse_id: string;
  zone_id: string;
  aisle: string; // e.g. 'A01'
  rack: string; // e.g. 'R04'
  shelf: string; // e.g. 'S02'
  bin_code: string; // e.g. 'A01-R04-S02'
  max_weight_kg: number;
  max_volume_cubic_meters: number;
  current_weight_kg: number;
  current_volume_cubic_meters: number;
  is_locked_for_count: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryBinAllocationTable {
  id: string; // UUID
  bin_id: string; // FK -> warehouse_bins.id
  variant_id: string; // FK -> variants.id
  quantity_on_hand: number;
  quantity_allocated: number; // Reserved for open pick waves
  lot_number?: string;
  expiry_date?: string;
  last_counted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ASNInboundShipmentTable {
  id: string; // UUID
  asn_number: string; // e.g. 'ASN-20260915-001'
  warehouse_id: string;
  seller_id: string;
  carrier_code: string; // e.g. 'FEDEX_FREIGHT'
  tracking_number: string;
  status: 'EXPECTED' | 'ARRIVED_AT_DOCK' | 'IN_RECEIVING' | 'RECEIVED' | 'QUARANTINED' | 'CANCELLED';
  expected_arrival_date: string;
  actual_arrival_date?: string;
  total_units_expected: number;
  total_units_received: number;
  total_units_damaged: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ASNInboundItemTable {
  id: string; // UUID
  asn_id: string; // FK -> asn_inbound_shipments.id
  variant_id: string;
  sku: string;
  quantity_expected: number;
  quantity_received: number;
  quantity_damaged: number;
  destination_bin_id?: string;
  status: 'PENDING' | 'RECEIVED' | 'DISCREPANCY';
  created_at: string;
}

export interface StockTransferOrderTable {
  id: string; // UUID
  transfer_number: string; // e.g. 'TO-20260915-004'
  source_warehouse_id: string;
  destination_warehouse_id: string;
  status: 'DRAFT' | 'APPROVED' | 'PICKING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  carrier_code?: string;
  tracking_number?: string;
  shipped_at?: string;
  received_at?: string;
  total_units: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryCycleCountTable {
  id: string; // UUID
  count_batch_number: string; // e.g. 'CC-2026-W37'
  warehouse_id: string;
  zone_id?: string;
  bin_id?: string;
  variant_id: string;
  system_recorded_quantity: number;
  physically_counted_quantity: number;
  variance_units: number;
  variance_cost_value: number;
  status: 'ASSIGNED' | 'COUNTING' | 'RECONCILED' | 'VARIANCE_FLAGGED' | 'ADJUSTED';
  counted_by_user_id: string;
  approved_by_user_id?: string;
  counted_at?: string;
  created_at: string;
}
