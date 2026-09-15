import { BaseRepository } from './base.repository.js';
import { BrandEntity } from '../schema/category_brand.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class BrandRepository extends BaseRepository<BrandEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('brands', db);
  }

  public async findBySlug(slug: string): Promise<BrandEntity | null> {
    return this.findOne({ slug });
  }

  public async getVerifiedBrands(): Promise<BrandEntity[]> {
    const sql = `SELECT * FROM brands WHERE is_verified = TRUE AND is_active = TRUE ORDER BY name ASC`;
    const rows = await this.db.query<BrandEntity>(sql);
    return rows.map((r) => this.mapRow(r));
  }
}
