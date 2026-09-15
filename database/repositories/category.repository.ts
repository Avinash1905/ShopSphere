import { BaseRepository } from './base.repository.js';
import { CategoryEntity } from '../schema/category_brand.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class CategoryRepository extends BaseRepository<CategoryEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('categories', db);
  }

  public async findBySlug(slug: string): Promise<CategoryEntity | null> {
    return this.findOne({ slug });
  }

  public async getRootCategories(): Promise<CategoryEntity[]> {
    const sql = `SELECT * FROM categories WHERE parent_id IS NULL AND is_active = TRUE ORDER BY display_order ASC, name ASC`;
    const rows = await this.db.query<CategoryEntity>(sql);
    return rows.map((r) => this.mapRow(r));
  }

  public async getSubcategories(parentId: string): Promise<CategoryEntity[]> {
    const sql = `SELECT * FROM categories WHERE parent_id = ? AND is_active = TRUE ORDER BY display_order ASC, name ASC`;
    const rows = await this.db.query<CategoryEntity>(sql, [parentId]);
    return rows.map((r) => this.mapRow(r));
  }

  public async getDescendants(hierarchyPath: string): Promise<CategoryEntity[]> {
    const sql = `SELECT * FROM categories WHERE hierarchy_path LIKE ? AND is_active = TRUE ORDER BY depth_level ASC, display_order ASC`;
    const rows = await this.db.query<CategoryEntity>(sql, [`${hierarchyPath}/%`]);
    return rows.map((r) => this.mapRow(r));
  }
}
