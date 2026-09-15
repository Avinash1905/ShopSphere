import { AggregationEngine } from './aggregation_engine.js';

export interface UserCohortRecord {
  userId: string;
  signupMonth: string; // e.g. 2026-01
  activityMonth: string; // e.g. 2026-03
  spend: number;
}

export interface CohortRetentionMatrix {
  cohorts: {
    cohortMonth: string;
    initialSize: number;
    retentionRates: Record<number, number>; // month index -> retention percentage
    revenuePerUser: Record<number, number>; // month index -> cumulative spend per user
  }[];
}

export class CohortAnalyticsEngine {
  public static computeRetentionMatrix(records: UserCohortRecord[]): CohortRetentionMatrix {
    // 1. Determine cohort initial sizes (Month 0 users)
    const cohortUsers = new Map<string, Set<string>>();
    const cohortMonthActivity = new Map<string, Map<number, Set<string>>>();
    const cohortMonthSpend = new Map<string, Map<number, number>>();

    for (const rec of records) {
      const cohort = rec.signupMonth;
      const act = rec.activityMonth;

      let uSet = cohortUsers.get(cohort);
      if (!uSet) {
        uSet = new Set();
        cohortUsers.set(cohort, uSet);
      }
      uSet.add(rec.userId);

      const monthDiff = this.calculateMonthDifference(cohort, act);
      if (monthDiff >= 0) {
        let actMap = cohortMonthActivity.get(cohort);
        if (!actMap) {
          actMap = new Map();
          cohortMonthActivity.set(cohort, actMap);
        }
        let activeUsers = actMap.get(monthDiff);
        if (!activeUsers) {
          activeUsers = new Set();
          actMap.set(monthDiff, activeUsers);
        }
        activeUsers.add(rec.userId);

        let spendMap = cohortMonthSpend.get(cohort);
        if (!spendMap) {
          spendMap = new Map();
          cohortMonthSpend.set(cohort, spendMap);
        }
        spendMap.set(monthDiff, (spendMap.get(monthDiff) || 0) + rec.spend);
      }
    }

    const sortedCohorts = Array.from(cohortUsers.keys()).sort();
    const result: CohortRetentionMatrix = { cohorts: [] };

    for (const cohort of sortedCohorts) {
      const initialSize = cohortUsers.get(cohort)?.size || 1;
      const actMap = cohortMonthActivity.get(cohort) || new Map();
      const spendMap = cohortMonthSpend.get(cohort) || new Map();

      const retentionRates: Record<number, number> = {};
      const revenuePerUser: Record<number, number> = {};

      for (let m = 0; m <= 12; m++) {
        if (actMap.has(m)) {
          const activeCount = actMap.get(m)!.size;
          retentionRates[m] = Math.round((activeCount / initialSize) * 10000) / 100;
        }
        if (spendMap.has(m)) {
          const totalSpend = spendMap.get(m)!;
          revenuePerUser[m] = Math.round((totalSpend / initialSize) * 100) / 100;
        }
      }

      result.cohorts.push({
        cohortMonth: cohort,
        initialSize,
        retentionRates,
        revenuePerUser,
      });
    }

    return result;
  }

  private static calculateMonthDifference(startMonth: string, endMonth: string): number {
    const [y1, m1] = startMonth.split('-').map(Number);
    const [y2, m2] = endMonth.split('-').map(Number);
    return (y2 - y1) * 12 + (m2 - m1);
  }
}
