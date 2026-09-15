/**
 * ShopSphere Database Repositories - Review Media, Helpful Votes, Seller Responses & Abandonment
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface ReviewMedia {
  id: string;
  review_id: string;
  media_type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
}

export interface ReviewSellerResponse {
  id: string;
  review_id: string;
  seller_id: string;
  response_text: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartAbandonmentLog {
  id: string;
  cart_id: string;
  user_id?: string;
  cart_total_value: number;
  item_count: number;
  abandoned_at: string;
  recovery_email_sent_at?: string;
  is_recovered: boolean;
}

export interface SavedForLaterItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  created_at: string;
}

export class ReviewMediaRepository extends BaseRepository<ReviewMedia> {
  constructor(db: MigrationDatabaseAdapter) {
    super('review_media', db);
  }

  public async attachMedia(reviewId: string, url: string, mediaType: 'IMAGE' | 'VIDEO', thumbnailUrl?: string): Promise<ReviewMedia> {
    const id = `revmed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    return this.create({
      id,
      review_id: reviewId,
      media_type: mediaType,
      url,
      thumbnail_url: thumbnailUrl,
      created_at: now,
    });
  }

  public async voteHelpful(reviewId: string, userId: string, isHelpful: boolean = true): Promise<ReviewHelpfulVote> {
    const id = `revvote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      review_id: reviewId,
      user_id: userId,
      is_helpful: isHelpful,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO review_helpful_votes (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<ReviewHelpfulVote>('SELECT * FROM review_helpful_votes WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as ReviewHelpfulVote;
  }

  public async logCartAbandonment(cartId: string, totalValue: number, itemCount: number, userId?: string): Promise<CartAbandonmentLog> {
    const id = `aban-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      cart_id: cartId,
      user_id: userId,
      cart_total_value: totalValue,
      item_count: itemCount,
      abandoned_at: now,
      is_recovered: false,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO cart_abandonment_logs (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<CartAbandonmentLog>('SELECT * FROM cart_abandonment_logs WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as CartAbandonmentLog;
  }

  public async saveForLater(userId: string, productId: string, variantId?: string): Promise<SavedForLaterItem> {
    const id = `sfl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      user_id: userId,
      product_id: productId,
      variant_id: variantId,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO saved_for_later_items (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<SavedForLaterItem>('SELECT * FROM saved_for_later_items WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as SavedForLaterItem;
  }
}
