import { BaseRepository } from './base.repository.js';
import { CouponEntity, CouponUsageEntity } from '../schema/coupon.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface CouponValidationResult {
  isValid: boolean;
  reason?: string;
  discountAmount?: number;
  coupon?: CouponEntity;
}

export class CouponRepository extends BaseRepository<CouponEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('coupons', db);
  }

  public async findByCode(code: string): Promise<CouponEntity | null> {
    return this.findOne({ code: code.toUpperCase().trim() });
  }

  public async validateCoupon(
    code: string,
    userId: string,
    orderSubtotal: number
  ): Promise<CouponValidationResult> {
    const coupon = await this.findByCode(code);
    if (!coupon) return { isValid: false, reason: 'Coupon code does not exist' };
    if (!coupon.is_active) return { isValid: false, reason: 'Coupon is not active' };

    const now = Date.now();
    if (coupon.start_date && new Date(coupon.start_date).getTime() > now + 1000) {
      return { isValid: false, reason: 'Coupon promotion has not started yet' };
    }
    if (coupon.end_date && new Date(coupon.end_date).getTime() < now) {
      return { isValid: false, reason: 'Coupon promotion has expired' };
    }

    if (coupon.min_order_amount && orderSubtotal < coupon.min_order_amount) {
      return { isValid: false, reason: `Minimum order amount of $${coupon.min_order_amount} required` };
    }

    if (coupon.usage_limit_total && coupon.times_used >= coupon.usage_limit_total) {
      return { isValid: false, reason: 'Coupon total usage limit has been reached' };
    }

    // Check user usage count
    if (coupon.usage_limit_per_user) {
      const usageCountRes = await this.db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ? AND user_id = ?`,
        [coupon.id, userId]
      );
      const userUsages = Number(usageCountRes[0]?.count || 0);
      if (userUsages >= coupon.usage_limit_per_user) {
        return { isValid: false, reason: 'You have already reached the maximum usage limit for this coupon' };
      }
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = (orderSubtotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else if (coupon.discount_type === 'FIXED_AMOUNT') {
      discount = Math.min(coupon.discount_value, orderSubtotal);
    } else if (coupon.discount_type === 'FREE_SHIPPING') {
      discount = coupon.discount_value;
    }

    return {
      isValid: true,
      discountAmount: Math.round(discount * 100) / 100,
      coupon,
    };
  }

  public async incrementUsage(couponId: string): Promise<void> {
    await this.db.execute(`UPDATE coupons SET times_used = times_used + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [couponId]);
  }
}

export class CouponUsageRepository extends BaseRepository<CouponUsageEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('coupon_usages', db);
  }

  public async recordUsage(couponId: string, userId: string, orderId: string, discountApplied: number): Promise<CouponUsageEntity> {
    const usageId = `cpu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return await this.create({
      id: usageId,
      coupon_id: couponId,
      user_id: userId,
      order_id: orderId,
      discount_applied: discountApplied,
    });
  }
}
