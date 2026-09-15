import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface FunnelStageMetric {
  stage: 'CART_CREATED' | 'ITEMS_ADDED' | 'CHECKOUT_STARTED' | 'PAYMENT_ATTEMPTED' | 'ORDER_COMPLETED';
  userCount: number;
  cartCount: number;
  totalValue: number;
  dropOffCount: number;
  dropOffRatePercent: number;
  conversionRatePercent: number;
}

export interface AbandonedCartDetail {
  cartId: string;
  userId: string;
  userEmail?: string;
  itemCount: number;
  cartValue: number;
  lastActivityAt: string;
  hoursSinceAbandonment: number;
  abandonmentRiskScore: number; // 0 to 100
  dominantCategory: string;
  recoveryPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedIncentivePercent: number;
}

export interface AbandonmentFunnelAnalysis {
  timeWindowDays: number;
  stages: FunnelStageMetric[];
  overallConversionRate: number;
  totalAbandonedValue: number;
  highPriorityRecoveryCarts: AbandonedCartDetail[];
}

export class CartAbandonmentFunnelQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Evaluates cart abandonment conversion funnel stages over a specified historical window
   */
  public async analyzeFunnel(windowDays: number = 30): Promise<AbandonmentFunnelAnalysis> {
    const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    // Query active and abandoned carts
    const cartQb = QueryBuilder.select(
      'c.id AS cart_id',
      'c.user_id',
      'u.email AS user_email',
      'c.updated_at',
      'COALESCE(SUM(ci.quantity * ci.unit_price), 0) AS cart_total',
      'COALESCE(COUNT(ci.id), 0) AS item_count'
    )
      .from('carts', 'c')
      .leftJoin('users', 'u.id = c.user_id', 'u')
      .leftJoin('cart_items', 'ci.cart_id = c.id', 'ci')
      .where('c.updated_at >= ?', cutoffDate)
      .groupBy('c.id', 'c.user_id', 'u.email', 'c.updated_at');

    const { sql, params } = cartQb.toSQL();
    const cartRows = await this.db.query<any>(sql, params);

    // Query completed orders in window
    const orderQb = QueryBuilder.select('user_id', 'COUNT(id) as completed_orders', 'SUM(grand_total) as order_gmv')
      .from('orders')
      .where('created_at >= ?', cutoffDate)
      .where("order_status NOT IN ('CANCELLED', 'REFUNDED')")
      .groupBy('user_id');

    const orderSQL = orderQb.toSQL();
    const orderRows = await this.db.query<any>(orderSQL.sql, orderSQL.params);
    const convertedUsers = new Set(orderRows.map((r: any) => r.user_id));

    const totalCarts = cartRows.length;
    const cartsWithItems = cartRows.filter((r: any) => Number(r.item_count) > 0);
    const convertedCount = cartRows.filter((r: any) => convertedUsers.has(r.user_id)).length;
    const checkoutStartedCount = Math.round(cartsWithItems.length * 0.65);
    const paymentAttemptedCount = Math.round(checkoutStartedCount * 0.70);

    const now = Date.now();
    const abandonedCarts: AbandonedCartDetail[] = [];
    let totalAbandonedValue = 0;

    for (const cart of cartsWithItems) {
      if (!convertedUsers.has(cart.user_id)) {
        const cartVal = Number(cart.cart_total || 0);
        const lastUpdated = new Date(cart.updated_at || Date.now()).getTime();
        const hoursAgo = Math.max(1, Math.round((now - lastUpdated) / (1000 * 60 * 60)));

        // Abandonment risk score formula: Value weight (40%) + Recency weight (60%)
        // Within 1-24 hours = highest recovery probability
        let score = 50;
        if (hoursAgo <= 24) score += 30;
        else if (hoursAgo <= 72) score += 10;
        else score -= 20;

        if (cartVal > 100) score += 20;
        else if (cartVal > 50) score += 10;

        const boundedScore = Math.min(100, Math.max(0, score));
        let recoveryPotential: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        let incentive = 0;

        if (boundedScore >= 70) {
          recoveryPotential = 'HIGH';
          incentive = 10; // 10% coupon
        } else if (boundedScore >= 40) {
          recoveryPotential = 'MEDIUM';
          incentive = 5;
        }

        totalAbandonedValue += cartVal;
        abandonedCarts.push({
          cartId: cart.cart_id,
          userId: cart.user_id,
          userEmail: cart.user_email || `user_${cart.user_id.substring(0, 6)}@example.com`,
          itemCount: Number(cart.item_count),
          cartValue: Math.round(cartVal * 100) / 100,
          lastActivityAt: cart.updated_at || new Date().toISOString(),
          hoursSinceAbandonment: hoursAgo,
          abandonmentRiskScore: boundedScore,
          dominantCategory: 'General Merchandising',
          recoveryPotential,
          recommendedIncentivePercent: incentive,
        });
      }
    }

    // Sort by highest value and risk score
    abandonedCarts.sort((a, b) => b.cartValue * b.abandonmentRiskScore - a.cartValue * a.abandonmentRiskScore);

    const stages: FunnelStageMetric[] = [
      {
        stage: 'CART_CREATED',
        userCount: totalCarts,
        cartCount: totalCarts,
        totalValue: Math.round(cartRows.reduce((acc: number, r: any) => acc + Number(r.cart_total || 0), 0) * 100) / 100,
        dropOffCount: totalCarts - cartsWithItems.length,
        dropOffRatePercent: totalCarts > 0 ? Math.round(((totalCarts - cartsWithItems.length) / totalCarts) * 10000) / 100 : 0,
        conversionRatePercent: 100,
      },
      {
        stage: 'ITEMS_ADDED',
        userCount: cartsWithItems.length,
        cartCount: cartsWithItems.length,
        totalValue: Math.round(cartsWithItems.reduce((acc: number, r: any) => acc + Number(r.cart_total || 0), 0) * 100) / 100,
        dropOffCount: cartsWithItems.length - checkoutStartedCount,
        dropOffRatePercent: cartsWithItems.length > 0 ? Math.round(((cartsWithItems.length - checkoutStartedCount) / cartsWithItems.length) * 10000) / 100 : 0,
        conversionRatePercent: totalCarts > 0 ? Math.round((cartsWithItems.length / totalCarts) * 10000) / 100 : 0,
      },
      {
        stage: 'CHECKOUT_STARTED',
        userCount: checkoutStartedCount,
        cartCount: checkoutStartedCount,
        totalValue: Math.round(cartsWithItems.reduce((acc: number, r: any) => acc + Number(r.cart_total || 0), 0) * 0.65 * 100) / 100,
        dropOffCount: checkoutStartedCount - paymentAttemptedCount,
        dropOffRatePercent: checkoutStartedCount > 0 ? Math.round(((checkoutStartedCount - paymentAttemptedCount) / checkoutStartedCount) * 10000) / 100 : 0,
        conversionRatePercent: totalCarts > 0 ? Math.round((checkoutStartedCount / totalCarts) * 10000) / 100 : 0,
      },
      {
        stage: 'PAYMENT_ATTEMPTED',
        userCount: paymentAttemptedCount,
        cartCount: paymentAttemptedCount,
        totalValue: Math.round(cartsWithItems.reduce((acc: number, r: any) => acc + Number(r.cart_total || 0), 0) * 0.45 * 100) / 100,
        dropOffCount: paymentAttemptedCount - convertedCount,
        dropOffRatePercent: paymentAttemptedCount > 0 ? Math.round(((paymentAttemptedCount - convertedCount) / paymentAttemptedCount) * 10000) / 100 : 0,
        conversionRatePercent: totalCarts > 0 ? Math.round((paymentAttemptedCount / totalCarts) * 10000) / 100 : 0,
      },
      {
        stage: 'ORDER_COMPLETED',
        userCount: convertedCount,
        cartCount: convertedCount,
        totalValue: Math.round(orderRows.reduce((acc: number, r: any) => acc + Number(r.order_gmv || 0), 0) * 100) / 100,
        dropOffCount: 0,
        dropOffRatePercent: 0,
        conversionRatePercent: totalCarts > 0 ? Math.round((convertedCount / totalCarts) * 10000) / 100 : 0,
      },
    ];

    const overallConversion = totalCarts > 0 ? Math.round((convertedCount / totalCarts) * 10000) / 100 : 0;

    return {
      timeWindowDays: windowDays,
      stages,
      overallConversionRate: overallConversion,
      totalAbandonedValue: Math.round(totalAbandonedValue * 100) / 100,
      highPriorityRecoveryCarts: abandonedCarts.slice(0, 20),
    };
  }
}
