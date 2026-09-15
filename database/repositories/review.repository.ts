import { BaseRepository, FindOptions, PaginatedResult } from './base.repository.js';
import { ReviewEntity, ReviewVoteEntity } from '../schema/review.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class ReviewRepository extends BaseRepository<ReviewEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('reviews', db);
  }

  public async getProductReviews(productId: string, options: FindOptions<ReviewEntity> = {}): Promise<PaginatedResult<ReviewEntity>> {
    return this.findAll({
      ...options,
      where: { product_id: productId, status: 'APPROVED' },
      sort: options.sort || [{ field: 'created_at', direction: 'DESC' }],
    });
  }

  public async addSellerReply(reviewId: string, reply: string): Promise<ReviewEntity> {
    const now = new Date().toISOString();
    return await this.update(reviewId, {
      seller_reply: reply,
      seller_replied_at: now,
    });
  }

  public async updateVoteCounts(reviewId: string): Promise<{ helpful: number; unhelpful: number }> {
    const sql = `
      SELECT 
        SUM(CASE WHEN is_helpful = 1 THEN 1 ELSE 0 END) as helpful_count,
        SUM(CASE WHEN is_helpful = 0 THEN 1 ELSE 0 END) as unhelpful_count
      FROM review_votes
      WHERE review_id = ?
    `;
    const rows = await this.db.query<{ helpful_count: number; unhelpful_count: number }>(sql, [reviewId]);
    const helpful = Number(rows[0]?.helpful_count || 0);
    const unhelpful = Number(rows[0]?.unhelpful_count || 0);

    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE reviews SET helpful_votes_count = ?, unhelpful_votes_count = ?, updated_at = ? WHERE id = ?`,
      [helpful, unhelpful, now, reviewId]
    );

    return { helpful, unhelpful };
  }
}

export class ReviewVoteRepository extends BaseRepository<ReviewVoteEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('review_votes', db);
  }

  public async vote(reviewId: string, userId: string, isHelpful: boolean): Promise<ReviewVoteEntity> {
    const existing = await this.findOne({ review_id: reviewId, user_id: userId });
    if (existing) {
      return await this.update(existing.id, { is_helpful: isHelpful });
    }

    const voteId = `rvote-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return await this.create({
      id: voteId,
      review_id: reviewId,
      user_id: userId,
      is_helpful: isHelpful,
    });
  }
}
