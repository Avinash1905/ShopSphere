import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface CustomerRFMProfile {
  userId: string;
  email: string;
  fullName: string;
  recencyDays: number;
  frequencyOrders: number;
  monetarySpend: number;
  rfmSegment: 'CHAMPION' | 'LOYAL_CUSTOMER' | 'POTENTIAL_LOYALIST' | 'AT_RISK' | 'HIBERNATING' | 'NEW_CUSTOMER';
}

export class CustomerQueries {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async getCustomerRFMSegments(): Promise<CustomerRFMProfile[]> {
    const qb = QueryBuilder.select(
      'u.id as user_id',
      'u.email',
      'u.first_name',
      'u.last_name',
      'COUNT(o.id) as order_count',
      'COALESCE(SUM(o.grand_total), 0) as total_spend',
      'COALESCE(MAX(o.created_at), u.created_at) as last_order_time'
    )
      .from('users', 'u')
      .leftJoin('orders', "o.user_id = u.id AND o.order_status NOT IN ('CANCELLED', 'REFUNDED')", 'o')
      .where('u.deleted_at IS NULL')
      .groupBy('u.id', 'u.email', 'u.first_name', 'u.last_name')
      .orderBy('total_spend', 'DESC');

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);
    const now = Date.now();

    return rows.map((r) => {
      const orderCount = Number(r.order_count);
      const totalSpend = Math.round(Number(r.total_spend) * 100) / 100;
      const lastTime = new Date(r.last_order_time).getTime();
      const recencyDays = Math.max(0, Math.floor((now - lastTime) / (1000 * 60 * 60 * 24)));

      let segment: CustomerRFMProfile['rfmSegment'] = 'NEW_CUSTOMER';
      if (orderCount >= 5 && totalSpend >= 2000 && recencyDays <= 30) {
        segment = 'CHAMPION';
      } else if (orderCount >= 3 && totalSpend >= 1000 && recencyDays <= 60) {
        segment = 'LOYAL_CUSTOMER';
      } else if (orderCount >= 1 && totalSpend >= 300 && recencyDays <= 45) {
        segment = 'POTENTIAL_LOYALIST';
      } else if (orderCount >= 2 && recencyDays > 90) {
        segment = 'AT_RISK';
      } else if (recencyDays > 180) {
        segment = 'HIBERNATING';
      }

      return {
        userId: r.user_id,
        email: r.email,
        fullName: `${r.first_name} ${r.last_name}`.trim(),
        recencyDays,
        frequencyOrders: orderCount,
        monetarySpend: totalSpend,
        rfmSegment: segment,
      };
    });
  }
}
