export interface MetricObservation {
  dimensions: Record<string, string>; // e.g. { device: 'iOS', country: 'US', gateway: 'Stripe' }
  baselineMetric: number;
  observedMetric: number;
  volumeWeight: number; // e.g. number of sessions or orders
}

export interface DimensionAnomalyContribution {
  dimensionName: string;
  dimensionValue: string;
  baselineRate: number;
  observedRate: number;
  percentageDelta: number;
  impactScore: number; // Weighted contribution to overall drop
  isPrimaryRootCause: boolean;
}

export interface RootCauseDiagnosisReport {
  overallBaseline: number;
  overallObserved: number;
  overallDeltaPercent: number;
  totalVolume: number;
  primarySuspectDimension?: string;
  primarySuspectValue?: string;
  contributions: DimensionAnomalyContribution[];
  explanationNarrative: string;
}

export class AnomalyRootCauseAnalyzer {
  /**
   * Slices multi-dimensional observations to isolate the primary driver of metric degradation
   */
  public static diagnose(observations: MetricObservation[]): RootCauseDiagnosisReport {
    if (observations.length === 0) {
      return {
        overallBaseline: 0,
        overallObserved: 0,
        overallDeltaPercent: 0,
        totalVolume: 0,
        contributions: [],
        explanationNarrative: 'No metric observation data provided for diagnosis.',
      };
    }

    let totalWeight = 0;
    let totalWeightedBaseline = 0;
    let totalWeightedObserved = 0;

    const dimensionStats = new Map<string, Map<string, { baselineWeighted: number; observedWeighted: number; weight: number }>>();

    for (const obs of observations) {
      totalWeight += obs.volumeWeight;
      totalWeightedBaseline += obs.baselineMetric * obs.volumeWeight;
      totalWeightedObserved += obs.observedMetric * obs.volumeWeight;

      for (const [dimKey, dimVal] of Object.entries(obs.dimensions)) {
        if (!dimensionStats.has(dimKey)) {
          dimensionStats.set(dimKey, new Map());
        }
        const valMap = dimensionStats.get(dimKey)!;
        if (!valMap.has(dimVal)) {
          valMap.set(dimVal, { baselineWeighted: 0, observedWeighted: 0, weight: 0 });
        }
        const stat = valMap.get(dimVal)!;
        stat.baselineWeighted += obs.baselineMetric * obs.volumeWeight;
        stat.observedWeighted += obs.observedMetric * obs.volumeWeight;
        stat.weight += obs.volumeWeight;
      }
    }

    const overallBase = totalWeight > 0 ? totalWeightedBaseline / totalWeight : 0;
    const overallObs = totalWeight > 0 ? totalWeightedObserved / totalWeight : 0;
    const overallDeltaPct = overallBase > 0 ? ((overallObs - overallBase) / overallBase) * 100 : 0;

    const contributions: DimensionAnomalyContribution[] = [];

    for (const [dimName, valMap] of dimensionStats.entries()) {
      for (const [dimVal, data] of valMap.entries()) {
        const baseRate = data.weight > 0 ? data.baselineWeighted / data.weight : 0;
        const obsRate = data.weight > 0 ? data.observedWeighted / data.weight : 0;
        const deltaPct = baseRate > 0 ? ((obsRate - baseRate) / baseRate) * 100 : 0;

        // Impact score = (Volume Share) * |Percentage Drop| * (Absolute Drop)
        const volShare = totalWeight > 0 ? data.weight / totalWeight : 0;
        const impact = Math.round(volShare * Math.abs(deltaPct) * (baseRate - obsRate) * 1000) / 1000;

        contributions.push({
          dimensionName: dimName,
          dimensionValue: dimVal,
          baselineRate: Math.round(baseRate * 100) / 100,
          observedRate: Math.round(obsRate * 100) / 100,
          percentageDelta: Math.round(deltaPct * 10) / 10,
          impactScore: impact,
          isPrimaryRootCause: false,
        });
      }
    }

    // Sort by largest negative impact
    contributions.sort((a, b) => b.impactScore - a.impactScore);

    let primaryDim: string | undefined;
    let primaryVal: string | undefined;

    if (contributions.length > 0 && contributions[0].impactScore > 0) {
      contributions[0].isPrimaryRootCause = true;
      primaryDim = contributions[0].dimensionName;
      primaryVal = contributions[0].dimensionValue;
    }

    const narrative = primaryDim
      ? `Anomaly detected: Overall metric shifted by ${Math.round(overallDeltaPct * 10) / 10}%. Primary root cause isolated to dimension '${primaryDim} = ${primaryVal}' which experienced a ${contributions[0].percentageDelta}% degradation and accounted for highest impact (${contributions[0].impactScore} pts).`
      : `Overall metric shifted by ${Math.round(overallDeltaPct * 10) / 10}%. No single dimensional outlier identified.`;

    return {
      overallBaseline: Math.round(overallBase * 100) / 100,
      overallObserved: Math.round(overallObs * 100) / 100,
      overallDeltaPercent: Math.round(overallDeltaPct * 10) / 10,
      totalVolume: totalWeight,
      primarySuspectDimension: primaryDim,
      primarySuspectValue: primaryVal,
      contributions: contributions.slice(0, 10),
      explanationNarrative: narrative,
    };
  }
}
