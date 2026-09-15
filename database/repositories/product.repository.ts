import { BaseRepository, FindOptions, PaginatedResult } from './base.repository.js';
import { ProductEntity } from '../schema/product.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class ProductRepository extends BaseRepository<ProductEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('products', db);
  }

  public async findBySlug(slug: string): Promise<ProductEntity | null> {
    return this.findOne({ slug: slug.toLowerCase() });
  }

  public async getFeaturedProducts(limit: number = 10): Promise<ProductEntity[]> {
    const sql = `
      SELECT * FROM products
      WHERE is_featured = TRUE AND status = 'PUBLISHED' AND deleted_at IS NULL
      ORDER BY rating_average DESC, total_sales_count DESC
      LIMIT ?
    `;
    const rows = await this.db.query<ProductEntity>(sql, [limit]);
    return rows.map((r) => this.mapRow(r));
  }

  public async getProductsByCategoryPath(hierarchyPath: string, options: FindOptions<ProductEntity> = {}): Promise<PaginatedResult<ProductEntity>> {
    const page = Math.max(1, options.pagination?.page || 1);
    const limit = Math.min(100, Math.max(1, options.pagination?.limit || 20));
    const offset = (page - 1) * limit;

    const countSql = `
      SELECT COUNT(p.id) as total_count FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE (c.hierarchy_path = ? OR c.hierarchy_path LIKE ?) AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL
    `;
    const countRes = await this.db.query<{ total_count: number }>(countSql, [hierarchyPath, `${hierarchyPath}/%`]);
    const total = Number(countRes[0]?.total_count || 0);

    const dataSql = `
      SELECT p.* FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE (c.hierarchy_path = ? OR c.hierarchy_path LIKE ?) AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL
      ORDER BY p.total_sales_count DESC, p.rating_average DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.query<ProductEntity>(dataSql, [hierarchyPath, `${hierarchyPath}/%`, limit, offset]);
    const data = rows.map((r) => this.mapRow(r));
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  public async updateProductRatingStats(productId: string): Promise<{ avgRating: number; reviewCount: number }> {
    const sql = `
      SELECT AVG(rating) as avg_rating, COUNT(id) as review_count
      FROM reviews
      WHERE product_id = ? AND status = 'APPROVED'
    `;
    const rows = await this.db.query<{ avg_rating: number; review_count: number }>(sql, [productId]);
    const avgRating = Math.round((Number(rows[0]?.avg_rating || 0)) * 100) / 100;
    const reviewCount = Number(rows[0]?.review_count || 0);

    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE products SET rating_average = ?, reviews_count = ?, updated_at = ? WHERE id = ?`,
      [avgRating, reviewCount, now, productId]
    );

    return { avgRating, reviewCount };
  }
}
