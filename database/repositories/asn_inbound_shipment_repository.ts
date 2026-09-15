import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { QueryBuilder } from '../queries/query_builder.js';
import { ASNInboundShipmentTable, ASNInboundItemTable } from '../schema/wms_warehouse_extended.schema.js';

export interface ReceiveItemScanInput {
  asnId: string;
  sku: string;
  quantityReceived: number;
  quantityDamaged?: number;
  destinationBinId?: string;
}

export interface ASNDiscrepancyReport {
  asnNumber: string;
  totalExpected: number;
  totalReceived: number;
  totalDamaged: number;
  hasDiscrepancy: boolean;
  itemDiscrepancies: Array<{
    sku: string;
    expected: number;
    received: number;
    damaged: number;
    variance: number;
    status: string;
  }>;
}

export class ASNInboundShipmentRepository {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Creates a new ASN inbound shipment manifest
   */
  public async createASN(
    asnData: Omit<ASNInboundShipmentTable, 'id' | 'total_units_received' | 'total_units_damaged' | 'created_at' | 'updated_at'>,
    items: Array<{ variantId: string; sku: string; quantityExpected: number }>
  ): Promise<{ asn: ASNInboundShipmentTable; items: ASNInboundItemTable[] }> {
    const asnId = `asn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const asn: ASNInboundShipmentTable = {
      id: asnId,
      ...asnData,
      total_units_received: 0,
      total_units_damaged: 0,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO asn_inbound_shipments (
        id, asn_number, warehouse_id, seller_id, carrier_code, tracking_number,
        status, expected_arrival_date, total_units_expected, total_units_received, total_units_damaged, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asn.id, asn.asn_number, asn.warehouse_id, asn.seller_id, asn.carrier_code, asn.tracking_number,
        asn.status, asn.expected_arrival_date, asn.total_units_expected, 0, 0, now, now
      ]
    );

    const createdItems: ASNInboundItemTable[] = [];
    for (const it of items) {
      const itemId = `asnitm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const itemRecord: ASNInboundItemTable = {
        id: itemId,
        asn_id: asnId,
        variant_id: it.variantId,
        sku: it.sku,
        quantity_expected: it.quantityExpected,
        quantity_received: 0,
        quantity_damaged: 0,
        status: 'PENDING',
        created_at: now,
      };

      await this.db.execute(
        `INSERT INTO asn_inbound_items (
          id, asn_id, variant_id, sku, quantity_expected, quantity_received, quantity_damaged, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, asnId, it.variantId, it.sku, it.quantityExpected, 0, 0, 'PENDING', now]
      );
      createdItems.push(itemRecord);
    }

    return { asn, items: createdItems };
  }

  /**
   * Scans and receives items against an ASN manifest
   */
  public async receiveItemScan(scan: ReceiveItemScanInput): Promise<ASNInboundItemTable> {
    const rows = await this.db.query<ASNInboundItemTable>(
      'SELECT * FROM asn_inbound_items WHERE asn_id = ? AND sku = ? LIMIT 1',
      [scan.asnId, scan.sku]
    );

    if (rows.length === 0) {
      throw new Error(`SKU '${scan.sku}' not listed on ASN manifest '${scan.asnId}'`);
    }

    const item = rows[0];
    const newReceived = item.quantity_received + scan.quantityReceived;
    const newDamaged = item.quantity_damaged + (scan.quantityDamaged || 0);
    const hasDiscrepancy = newReceived !== item.quantity_expected || newDamaged > 0;
    const newStatus = hasDiscrepancy ? 'DISCREPANCY' : 'RECEIVED';

    await this.db.execute(
      `UPDATE asn_inbound_items 
       SET quantity_received = ?, quantity_damaged = ?, destination_bin_id = ?, status = ?
       WHERE id = ?`,
      [newReceived, newDamaged, scan.destinationBinId || item.destination_bin_id, newStatus, item.id]
    );

    item.quantity_received = newReceived;
    item.quantity_damaged = newDamaged;
    item.status = newStatus;
    if (scan.destinationBinId) item.destination_bin_id = scan.destinationBinId;

    return item;
  }

  /**
   * Generates discrepancy summary for ASN completion
   */
  public async auditASNDiscrepancies(asnId: string): Promise<ASNDiscrepancyReport> {
    const asnRows = await this.db.query<ASNInboundShipmentTable>('SELECT * FROM asn_inbound_shipments WHERE id = ?', [asnId]);
    const items = await this.db.query<ASNInboundItemTable>('SELECT * FROM asn_inbound_items WHERE asn_id = ?', [asnId]);

    const asn = asnRows[0] || { asn_number: 'UNKNOWN' };
    let totExpected = 0;
    let totReceived = 0;
    let totDamaged = 0;

    const discrepancies = items.map((it) => {
      totExpected += Number(it.quantity_expected || 0);
      totReceived += Number(it.quantity_received || 0);
      totDamaged += Number(it.quantity_damaged || 0);
      const variance = it.quantity_received - it.quantity_expected;

      return {
        sku: it.sku,
        expected: it.quantity_expected,
        received: it.quantity_received,
        damaged: it.quantity_damaged,
        variance,
        status: it.status,
      };
    });

    return {
      asnNumber: asn.asn_number,
      totalExpected: totExpected,
      totalReceived: totReceived,
      totalDamaged: totDamaged,
      hasDiscrepancy: totReceived !== totExpected || totDamaged > 0,
      itemDiscrepancies: discrepancies,
    };
  }
}
