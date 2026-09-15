import { BaseRepository } from './base.repository.js';
import { WishlistEntity, WishlistItemEntity } from '../schema/wishlist.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class WishlistRepository extends BaseRepository<WishlistEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('wishlists', db);
  }

  public async getUserWishlists(userId: string): Promise<WishlistEntity[]> {
    const sql = `SELECT * FROM wishlists WHERE user_id = ? ORDER BY created_at DESC`;
    const rows = await this.db.query<WishlistEntity>(sql, [userId]);
    return rows.map((r) => this.mapRow(r));
  }

  public async findByShareToken(token: string): Promise<WishlistEntity | null> {
    return this.findOne({ share_token: token, is_public: true });
  }
}

export class WishlistItemRepository extends BaseRepository<WishlistItemEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('wishlist_items', db);
  }

  public async getItemsByWishlistId(wishlistId: string): Promise<WishlistItemEntity[]> {
    const sql = `SELECT * FROM wishlist_items WHERE wishlist_id = ? ORDER BY priority ASC, added_at DESC`;
    const rows = await this.db.query<WishlistItemEntity>(sql, [wishlistId]);
    return rows.map((r) => this.mapRow(r));
  }
}
