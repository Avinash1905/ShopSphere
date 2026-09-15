import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { StockTransferOrderTable } from '../schema/wms_warehouse_extended.schema.js';

export class StockTransferRepository {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Creates a new inter-warehouse stock transfer order
   */
  public async createTransferOrder(
    sourceWarehouseId: string,
    destinationWarehouseId: string,
    totalUnits: number,
    carrierCode?: string,
    trackingNumber?: string
  ): Promise<StockTransferOrderTable> {
    const id = `xfer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const xferNumber = `TO-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

    const order: StockTransferOrderTable = {
      id,
      transfer_number: xferNumber,
      source_warehouse_id: sourceWarehouseId,
      destination_warehouse_id: destinationWarehouseId,
      status: 'APPROVED',
      carrier_code: carrierCode || 'INTERNAL_FLEET',
      tracking_number: trackingNumber || `TRK-XFER-${Date.now()}`,
      total_units: totalUnits,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO stock_transfer_orders (
        id, transfer_number, source_warehouse_id, destination_warehouse_id, status, carrier_code, tracking_number, total_units, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id, order.transfer_number, order.source_warehouse_id, order.destination_warehouse_id,
        order.status, order.carrier_code, order.tracking_number, order.total_units, now, now
      ]
    );

    return order;
  }

  /**
   * Updates transfer status to IN_TRANSIT with ship timestamp
   */
  public async markShipped(transferId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      "UPDATE stock_transfer_orders SET status = 'IN_TRANSIT', shipped_at = ?, updated_at = ? WHERE id = ?",
      [now, now, transferId]
    );
  }

  /**
   * Updates transfer status to RECEIVED with receive timestamp
   */
  public async markReceived(transferId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      "UPDATE stock_transfer_orders SET status = 'RECEIVED', received_at = ?, updated_at = ? WHERE id = ?",
      [now, now, transferId]
    );
  }
}
