import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export type CustomerSegment =
  | 'CHAMPION'
  | 'LOYAL_CUSTOMER'
  | 'POTENTIAL_LOYALIST'
  | 'PROMISING_NEW'
  | 'NEED_ATTENTION'
  | 'AT_RISK'
  | 'CANT_LOSE_THEM'
  | 'HIBERNATING'
  | 'LOST';

export interface ExtendedCustomerRFMProfile {
  userId: string;
  email: string;
  recencyDays: number;
  frequencyCount: number;
  monetaryTotal: number;
  averageOrderValue: number;
  rScore: number; // 1 to 5
  fScore: number; // 1 to 5
  mScore: number; // 1 to 5
  compositeRFMScore: number; // e.g. 555
  segment: CustomerSegment;
  churnProbabilityPercent: number;
  projected12MonthLtv: number;
  firstOrderDate: string;
  lastOrderDate: string;
}

export interface CohortRetentionBucket {
  cohortMonth: string; // e.g. '2026-01'
  initialCohortSize: number;
  retentionByMonth: number[]; // [100, 45, 38, 32, 28] percentage retained
  totalCumulativeRevenue: number;
}

export interface LTVPortfolioOverview {
  totalCustomers: number;
  totalHistoricalRevenue: number;
  averageCustomerLtv: number;
  championsCount: number;
  atRiskCount: number;
  segmentsDistribution: Record<CustomerSegment, number>;
  profiles: ExtendedCustomerRFMProfile[];
}

export class CustomerLifetimeValueQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Evaluates RFM metrics and forward LTV predictions for all customers
   */
  public async analyzeCustomerPortfolio(): Promise<LTVPortfolioOverview> {
    const qb = QueryBuilder.select(
      'u.id AS user_id',
      'u.email',
      'COUNT(o.id) AS order_count',
      'COALESCE(SUM(o.grand_total), 0) AS total_spend',
      'MIN(o.created_at) AS first_order_date',
      'MAX(o.created_at) AS last_order_date'
    )
      .from('users', 'u')
      .innerJoin('orders', 'o.user_id = u.id', 'o')
      .where("o.order_status NOT IN ('CANCELLED', 'REFUNDED')")
      .groupBy('u.id', 'u.email');

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    const now = Date.now();
    const profiles: ExtendedCustomerRFMProfile[] = [];
    const segmentDist: Record<CustomerSegment, number> = {
      CHAMPION: 0,
      LOYAL_CUSTOMER: 0,
      POTENTIAL_LOYALIST: 0,
      PROMISING_NEW: 0,
      NEED_ATTENTION: 0,
      AT_RISK: 0,
      CANT_LOSE_THEM: 0,
      HIBERNATING: 0,
      LOST: 0,
    };

    let totalSpendSum = 0;

    for (const r of rows) {
      const orders = Number(r.order_count || 0);
      const spend = Number(r.total_spend || 0);
      totalSpendSum += spend;
      const lastDate = r.last_order_date ? new Date(r.last_order_date).getTime() : now;
      const recencyDays = Math.max(0, Math.round((now - lastDate) / (1000 * 60 * 60 * 24)));
      const aov = orders > 0 ? Math.round((spend / orders) * 100) / 100 : 0;

      // Calculate R Score (1 to 5): lower recency days = higher score
      const rScore = recencyDays <= 14 ? 5 : recencyDays <= 30 ? 4 : recencyDays <= 60 ? 3 : recencyDays <= 120 ? 2 : 1;

      // Calculate F Score (1 to 5): higher frequency = higher score
      const fScore = orders >= 10 ? 5 : orders >= 6 ? 4 : orders >= 3 ? 3 : orders >= 2 ? 2 : 1;

      // Calculate M Score (1 to 5): higher spend = higher score
      const mScore = spend >= 2000 ? 5 : spend >= 1000 ? 4 : spend >= 500 ? 3 : spend >= 150 ? 2 : 1;

      const rfm = rScore * 100 + fScore * 10 + mScore;

      // Segment assignment matrix
      let segment: CustomerSegment = 'POTENTIAL_LOYALIST';
      let churnProb = 20;

      if (rScore >= 4 && fScore >= 4 && mScore >= 4) {
        segment = 'CHAMPION';
        churnProb = 5;
      } else if (fScore >= 3 && mScore >= 3) {
        segment = 'LOYAL_CUSTOMER';
        churnProb = 15;
      } else if (rScore >= 4 && fScore === 1) {
        segment = 'PROMISING_NEW';
        churnProb = 35;
      } else if (rScore === 3 && fScore >= 2) {
        segment = 'NEED_ATTENTION';
        churnProb = 45;
      } else if (rScore <= 2 && fScore >= 3) {
        segment = 'AT_RISK';
        churnProb = 70;
      } else if (rScore === 1 && fScore >= 4) {
        segment = 'CANT_LOSE_THEM';
        churnProb = 85;
      } else if (rScore <= 2 && fScore <= 2 && mScore <= 2) {
        segment = 'HIBERNATING';
        churnProb = 90;
      } else if (rScore === 1) {
        segment = 'LOST';
        churnProb = 98;
      }

      segmentDist[segment]++;

      // 12-Month Forward LTV formula: AOV * (Frequency / Year) * (1 - ChurnProb) * Gross Margin (0.35)
      const annualFrequency = Math.max(1, (orders / Math.max(1, recencyDays / 30)) * 12);
      const forwardLtv = Math.round(aov * annualFrequency * (1 - churnProb / 100) * 0.35 * 100) / 100;

      profiles.push({
        userId: r.user_id,
        email: r.email || `user_${r.user_id.substring(0, 6)}@example.com`,
        recencyDays,
        frequencyCount: orders,
        monetaryTotal: Math.round(spend * 100) / 100,
        averageOrderValue: aov,
        rScore,
        fScore,
        mScore,
        compositeRFMScore: rfm,
        segment,
        churnProbabilityPercent: churnProb,
        projected12MonthLtv: Math.max(0, forwardLtv),
        firstOrderDate: r.first_order_date || new Date().toISOString(),
        lastOrderDate: r.last_order_date || new Date().toISOString(),
      });
    }

    const totalCust = profiles.length;
    const avgLtv = totalCust > 0 ? Math.round((totalSpendSum / totalCust) * 100) / 100 : 0;

    return {
      totalCustomers: totalCust,
      totalHistoricalRevenue: Math.round(totalSpendSum * 100) / 100,
      averageCustomerLtv: avgLtv,
      championsCount: segmentDist.CHAMPION,
      atRiskCount: segmentDist.AT_RISK + segmentDist.CANT_LOSE_THEM,
      segmentsDistribution: segmentDist,
      profiles,
    };
  }

  /**
   * Generates cohort retention matrix across chronological monthly signup cohorts
   */
  public async computeMonthlyCohortRetention(): Promise<CohortRetentionBucket[]> {
    const qb = QueryBuilder.select(
      'u.id AS user_id',
      'u.created_at AS signup_date',
      'o.id AS order_id',
      'o.grand_total',
      'o.created_at AS order_date'
    )
      .from('users', 'u')
      .leftJoin('orders', 'o.user_id = u.id', 'o')
      .where("o.order_status IS NULL OR o.order_status NOT IN ('CANCELLED', 'REFUNDED')");

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    const cohortMap = new Map<string, { users: Set<string>; monthlyOrders: Map<number, Set<string>>; revenue: number }>();

    for (const r of rows) {
      const signupDate = new Date(r.signup_date || '2026-01-01');
      const cohortKey = `${signupDate.getFullYear()}-${String(signupDate.getMonth() + 1).padStart(2, '0')}`;

      if (!cohortMap.has(cohortKey)) {
        cohortMap.set(cohortKey, {
          users: new Set(),
          monthlyOrders: new Map(),
          revenue: 0,
        });
      }

      const cData = cohortMap.get(cohortKey)!;
      cData.users.add(r.user_id);

      if (r.order_id && r.order_date) {
        cData.revenue += Number(r.grand_total || 0);
        const orderDate = new Date(r.order_date);
        const monthDiff = (orderDate.getFullYear() - signupDate.getFullYear()) * 12 + (orderDate.getMonth() - signupDate.getMonth());
        if (monthDiff >= 0) {
          if (!cData.monthlyOrders.has(monthDiff)) {
            cData.monthlyOrders.set(monthDiff, new Set());
          }
          cData.monthlyOrders.get(monthDiff)!.add(r.user_id);
        }
      }
    }

    const result: CohortRetentionBucket[] = [];

    for (const [cohortMonth, cData] of cohortMap.entries()) {
      const cohortSize = cData.users.size || 1;
      const retentionRates: number[] = [];

      for (let m = 0; m <= 5; m++) {
        const activeUsersInMonth = cData.monthlyOrders.get(m)?.size || (m === 0 ? cohortSize : 0);
        const rate = Math.round((activeUsersInMonth / cohortSize) * 10000) / 100;
        retentionRates.push(rate);
      }

      result.push({
        cohortMonth,
        initialCohortSize: cohortSize,
        retentionByMonth: retentionRates,
        totalCumulativeRevenue: Math.round(cData.revenue * 100) / 100,
      });
    }

    return result.sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth));
  }
}
