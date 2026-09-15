import { BaseRepository } from './base.repository.js';
import { SellerEntity } from '../schema/seller.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class SellerRepository extends BaseRepository<SellerEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('sellers', db);
  }

  public async findByUserId(userId: string): Promise<SellerEntity | null> {
    return this.findOne({ user_id: userId });
  }

  public async findBySlug(slug: string): Promise<SellerEntity | null> {
    return this.findOne({ store_slug: slug.toLowerCase() });
  }

  public async updateVerificationStatus(
    sellerId: string,
    status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
    notes?: string,
    verifiedBy?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE sellers SET verification_status = ?, verification_notes = ?, verified_at = ?, verified_by = ?, updated_at = ? WHERE id = ?`,
      [status, notes || null, now, verifiedBy || null, now, sellerId]
    );
  }

  public async incrementSalesAndRevenue(sellerId: string, salesCount: number, revenueAmount: number): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE sellers SET total_sales_count = total_sales_count + ?, total_revenue_amount = total_revenue_amount + ?, updated_at = ? WHERE id = ?`,
      [salesCount, revenueAmount, now, sellerId]
    );
  }

  public async recalculateSellerRating(sellerId: string): Promise<{ avgRating: number; reviewCount: number }> {
    const sql = `
      SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
      FROM reviews r
      INNER JOIN products p ON p.id = r.product_id
      WHERE p.seller_id = ? AND r.status = 'APPROVED'
    `;
    const rows = await this.db.query<{ avg_rating: number; review_count: number }>(sql, [sellerId]);
    const avgRating = Math.round((Number(rows[0]?.avg_rating || 0)) * 100) / 100;
    const reviewCount = Number(rows[0]?.review_count || 0);

    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE sellers SET rating_average = ?, total_reviews_count = ?, updated_at = ? WHERE id = ?`,
      [avgRating, reviewCount, now, sellerId]
    );

    return { avgRating, reviewCount };
  }
}
