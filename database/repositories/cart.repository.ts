import { BaseRepository } from './base.repository.js';
import { CartEntity, CartItemEntity } from '../schema/cart.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class CartRepository extends BaseRepository<CartEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('carts', db);
  }

  public async getActiveCartByUserId(userId: string): Promise<CartEntity | null> {
    return this.findOne({ user_id: userId, status: 'ACTIVE' });
  }

  public async getActiveCartBySessionId(sessionId: string): Promise<CartEntity | null> {
    return this.findOne({ session_id: sessionId, status: 'ACTIVE' });
  }

  public async mergeGuestCart(sessionId: string, userId: string): Promise<CartEntity> {
    let userCart = await this.getActiveCartByUserId(userId);
    const guestCart = await this.getActiveCartBySessionId(sessionId);

    if (!guestCart) {
      if (!userCart) {
        userCart = await this.create({
          id: `cart-${userId}`,
          user_id: userId,
          currency: 'USD',
          status: 'ACTIVE',
        });
      }
      return userCart;
    }

    if (!userCart) {
      // Transfer guest cart to user
      await this.db.execute(`UPDATE carts SET user_id = ?, session_id = NULL WHERE id = ?`, [userId, guestCart.id]);
      return (await this.findById(guestCart.id))!;
    }

    // Merge guest cart items into user cart
    const guestItems = await this.db.query<CartItemEntity>(`SELECT * FROM cart_items WHERE cart_id = ?`, [guestCart.id]);

    for (const item of guestItems) {
      const existing = await this.db.query<CartItemEntity>(
        `SELECT * FROM cart_items WHERE cart_id = ? AND variant_id = ?`,
        [userCart.id, item.variant_id]
      );
      if (existing.length > 0) {
        const newQty = existing[0].quantity + item.quantity;
        const newTotal = newQty * existing[0].unit_price;
        await this.db.execute(
          `UPDATE cart_items SET quantity = ?, total_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [newQty, newTotal, existing[0].id]
        );
      } else {
        await this.db.execute(
          `UPDATE cart_items SET cart_id = ? WHERE id = ?`,
          [userCart.id, item.id]
        );
      }
    }

    // Mark guest cart as merged
    await this.db.execute(`UPDATE carts SET status = 'MERGED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [guestCart.id]);
    return userCart;
  }
}

export class CartItemRepository extends BaseRepository<CartItemEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('cart_items', db);
  }

  public async getItemsByCartId(cartId: string): Promise<CartItemEntity[]> {
    const sql = `SELECT * FROM cart_items WHERE cart_id = ? ORDER BY added_at ASC`;
    const rows = await this.db.query<CartItemEntity>(sql, [cartId]);
    return rows.map((r) => this.mapRow(r));
  }

  public async addItem(cartId: string, variantId: string, quantity: number, unitPrice: number): Promise<CartItemEntity> {
    const existing = await this.findOne({ cart_id: cartId, variant_id: variantId });
    if (existing) {
      const newQty = existing.quantity + quantity;
      const newTotal = newQty * unitPrice;
      return await this.update(existing.id, {
        quantity: newQty,
        unit_price: unitPrice,
        total_price: newTotal,
      });
    }

    const newItemId = `ci-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return await this.create({
      id: newItemId,
      cart_id: cartId,
      variant_id: variantId,
      quantity,
      unit_price: unitPrice,
      total_price: quantity * unitPrice,
    });
  }
}
