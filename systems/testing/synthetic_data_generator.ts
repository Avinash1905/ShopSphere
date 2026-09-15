import { SeedPRNG } from '../../database/seeds/seed_runner.js';

export interface SyntheticDatasetSummary {
  usersCount: number;
  sellersCount: number;
  productsCount: number;
  variantsCount: number;
  inventoryCount: number;
  ordersCount: number;
  orderItemsCount: number;
  paymentsCount: number;
  auditLogsCount: number;
  totalRecordsGenerated: number;
}

export class SyntheticDataGenerator {
  private rng: SeedPRNG;

  constructor(seed: number = 42) {
    this.rng = new SeedPRNG(seed);
  }

  /**
   * Generates a fully linked relational relational graph of synthetic records
   */
  public generateRelationalDataset(userCount: number = 50, ordersPerUser: number = 2): {
    users: any[];
    sellers: any[];
    products: any[];
    variants: any[];
    orders: any[];
    orderItems: any[];
    payments: any[];
    auditLogs: any[];
    summary: SyntheticDatasetSummary;
  } {
    const users: any[] = [];
    const sellers: any[] = [];
    const products: any[] = [];
    const variants: any[] = [];
    const orders: any[] = [];
    const orderItems: any[] = [];
    const payments: any[] = [];
    const auditLogs: any[] = [];

    // 1. Sellers
    for (let s = 1; s <= 5; s++) {
      sellers.push({
        id: `synth-seller-${s}`,
        user_id: `synth-user-${s}`,
        business_name: `Synthetic Enterprise Merchant ${s}`,
        is_verified: true,
      });
    }

    // 2. Users
    for (let u = 1; u <= userCount; u++) {
      const uId = `synth-user-${u}`;
      users.push({
        id: uId,
        email: `synth_buyer_${u}@shopsphere-test.io`,
        first_name: `BuyerFirstName${u}`,
        last_name: `BuyerLastName${u}`,
        role: u <= 5 ? 'SELLER' : 'CUSTOMER',
        created_at: new Date(Date.now() - (userCount - u) * 86400000).toISOString(),
      });

      // 3. Orders per user
      for (let o = 1; o <= ordersPerUser; o++) {
        const orderId = `synth-ord-${u}-${o}`;
        const seller = sellers[this.rng.nextInt(0, sellers.length - 1)];
        const grandTotal = this.rng.nextDecimal(25, 450, 2);

        orders.push({
          id: orderId,
          user_id: uId,
          seller_id: seller.id,
          order_status: 'DELIVERED',
          grand_total: grandTotal,
          created_at: new Date(Date.now() - this.rng.nextInt(1, 30) * 86400000).toISOString(),
        });

        // 4. Order Items
        const itemCount = this.rng.nextInt(1, 3);
        for (let it = 1; it <= itemCount; it++) {
          orderItems.push({
            id: `synth-item-${orderId}-${it}`,
            order_id: orderId,
            variant_id: `synth-var-${this.rng.nextInt(1, 20)}`,
            quantity: this.rng.nextInt(1, 2),
            unit_price: Math.round((grandTotal / itemCount) * 100) / 100,
          });
        }

        // 5. Payment
        payments.push({
          id: `synth-pay-${orderId}`,
          order_id: orderId,
          amount: Math.round(grandTotal * 100) / 100,
          payment_status: 'COMPLETED',
          gateway_name: 'STRIPE',
        });

        // 6. Audit Log
        auditLogs.push({
          id: `synth-aud-${orderId}`,
          user_id: uId,
          action: 'ORDER_PLACED',
          entity_type: 'order',
          entity_id: orderId,
          created_at: new Date().toISOString(),
        });
      }
    }

    // 7. Products and Variants
    for (let p = 1; p <= 20; p++) {
      const prodId = `synth-prod-${p}`;
      const seller = sellers[this.rng.nextInt(0, sellers.length - 1)];
      products.push({
        id: prodId,
        seller_id: seller.id,
        title: `Synthetic Product Item ${p}`,
        base_price: this.rng.nextInt(20, 500),
        status: 'PUBLISHED',
      });

      variants.push({
        id: `synth-var-${p}`,
        product_id: prodId,
        sku: `SYNTH-SKU-${p}`,
        price: this.rng.nextInt(20, 500),
        status: 'ACTIVE',
      });
    }

    const total =
      users.length +
      sellers.length +
      products.length +
      variants.length +
      orders.length +
      orderItems.length +
      payments.length +
      auditLogs.length;

    return {
      users,
      sellers,
      products,
      variants,
      orders,
      orderItems,
      payments,
      auditLogs,
      summary: {
        usersCount: users.length,
        sellersCount: sellers.length,
        productsCount: products.length,
        variantsCount: variants.length,
        inventoryCount: variants.length,
        ordersCount: orders.length,
        orderItemsCount: orderItems.length,
        paymentsCount: payments.length,
        auditLogsCount: auditLogs.length,
        totalRecordsGenerated: total,
      },
    };
  }
}
