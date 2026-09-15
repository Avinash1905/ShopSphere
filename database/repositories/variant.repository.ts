import { BaseRepository } from './base.repository.js';
import { ProductVariantEntity } from '../schema/variant_inventory.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class VariantRepository extends BaseRepository<ProductVariantEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('variants', db);
  }

  public async findBySku(sku: string): Promise<ProductVariantEntity | null> {
    return this.findOne({ sku: sku.trim() });
  }

  public async findByBarcode(barcode: string): Promise<ProductVariantEntity | null> {
    return this.findOne({ barcode: barcode.trim() });
  }

  public async findByProductId(productId: string): Promise<ProductVariantEntity[]> {
    const sql = `SELECT * FROM variants WHERE product_id = ? AND deleted_at IS NULL ORDER BY display_order ASC, price ASC`;
    const rows = await this.db.query<ProductVariantEntity>(sql, [productId]);
    return rows.map((r) => this.mapRow(r));
  }
}
