export interface RetentionDayPoint {
  dayNumber: number;
  retentionPercent: number; // 0.0 to 100.0%
  activeUserEstimate: number;
  churnHazardRate: number; // Instantaneous churn probability
}

export interface RetentionModelSummary {
  cohortName: string;
  initialCohortSize: number;
  decayFunction: 'POWER_LAW' | 'EXPONENTIAL' | 'WEIBULL';
  halfLifeDays: number;
  asymptoticStickyRetentionFloorPercent: number;
  projectedRetentionCurve: RetentionDayPoint[];
}

export class RetentionDecayCurveModeler {
  /**
   * Fits power-law decay curve: R(t) = (1 - floor) * (1 + t / alpha)^(-beta) + floor
   */
  public static modelPowerLawDecay(
    cohortName: string,
    initialSize: number,
    alpha: number = 2.5,
    beta: number = 0.65,
    retentionFloorPercent: number = 12.0
  ): RetentionModelSummary {
    const days = [1, 3, 7, 14, 30, 60, 90, 180, 365];
    const floorFraction = retentionFloorPercent / 100;
    const curve: RetentionDayPoint[] = [];

    let halfLife = 30;
    let halfLifeFound = false;

    for (const d of days) {
      const decayComponent = Math.pow(1 + d / alpha, -beta);
      const retentionFrac = (1 - floorFraction) * decayComponent + floorFraction;
      const retentionPct = Math.round(retentionFrac * 10000) / 100;
      const activeUsers = Math.round(initialSize * retentionFrac);

      // Instantaneous hazard rate h(t) = - (dR/dt) / R(t)
      const hazard = Math.round((beta / (alpha + d)) * 10000) / 100;

      if (!halfLifeFound && retentionPct <= 50.0) {
        halfLife = d;
        halfLifeFound = true;
      }

      curve.push({
        dayNumber: d,
        retentionPercent: retentionPct,
        activeUserEstimate: activeUsers,
        churnHazardRate: hazard,
      });
    }

    return {
      cohortName,
      initialCohortSize: initialSize,
      decayFunction: 'POWER_LAW',
      halfLifeDays: halfLife,
      asymptoticStickyRetentionFloorPercent: retentionFloorPercent,
      projectedRetentionCurve: curve,
    };
  }

  /**
   * Computes expected customer lifetime in days: integral of R(t) dt from 0 to T
   */
  public static calculateExpectedLifetimeDays(model: RetentionModelSummary, horizonDays: number = 365): number {
    let totalDays = 0;
    const curve = model.projectedRetentionCurve;

    for (let i = 0; i < curve.length - 1; i++) {
      const p1 = curve[i];
      const p2 = curve[i + 1];
      const deltaT = p2.dayNumber - p1.dayNumber;
      const avgR = ((p1.retentionPercent + p2.retentionPercent) / 2) / 100;
      totalDays += deltaT * avgR;
    }

    return Math.round(totalDays * 10) / 10;
  }
}
