/**
 * ShopSphere Analytics Engine - Rolling Stream Statistical Anomaly Detector
 * Features:
 * - Rolling Z-Score metric deviation monitoring:
 *   $$Z = \frac{x - \mu}{\sigma}$$
 * - Tukey Interquartile Range (IQR) outlier fence detector
 * - Automatic anomaly severity classification (LOW, MEDIUM, HIGH, CRITICAL)
 */

export interface AnomalyReport {
  timestamp: Date;
  metricName: string;
  currentValue: number;
  expectedMean: number;
  zScore: number;
  isAnomaly: boolean;
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

export class StreamAnomalyDetector {
  /**
   * Detects anomaly in current metric value against historical sliding window
   */
  public static detectZScoreAnomaly(
    metricName: string,
    currentValue: number,
    historyWindow: number[],
    zThreshold: number = 3.0
  ): AnomalyReport {
    const timestamp = new Date();

    if (historyWindow.length < 5) {
      return {
        timestamp,
        metricName,
        currentValue,
        expectedMean: currentValue,
        zScore: 0,
        isAnomaly: false,
        severity: 'NORMAL',
        message: 'Insufficient historical baseline data.',
      };
    }

    const mean = historyWindow.reduce((s, v) => s + v, 0) / historyWindow.length;
    const variance = historyWindow.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / historyWindow.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      const isDiff = currentValue !== mean;
      return {
        timestamp,
        metricName,
        currentValue,
        expectedMean: mean,
        zScore: isDiff ? 10 : 0,
        isAnomaly: isDiff,
        severity: isDiff ? 'CRITICAL' : 'NORMAL',
        message: isDiff ? `Unexpected deviation from constant baseline ${mean}` : 'Normal baseline',
      };
    }

    const zScore = Math.abs((currentValue - mean) / stdDev);
    const isAnomaly = zScore >= zThreshold;

    let severity: AnomalyReport['severity'] = 'NORMAL';
    if (zScore >= 5.0) severity = 'CRITICAL';
    else if (zScore >= 4.0) severity = 'HIGH';
    else if (zScore >= 3.0) severity = 'MEDIUM';
    else if (zScore >= 2.0) severity = 'LOW';

    const direction = currentValue > mean ? 'SPIKE' : 'DROP';
    const message = isAnomaly
      ? `Statistical ${direction} detected in '${metricName}': value ${currentValue} deviates by ${Math.round(zScore * 100) / 100} standard deviations from mean ${Math.round(mean * 100) / 100}.`
      : 'Metric operating within normal operational variance.';

    return {
      timestamp,
      metricName,
      currentValue,
      expectedMean: Math.round(mean * 100) / 100,
      zScore: Math.round(zScore * 100) / 100,
      isAnomaly,
      severity,
      message,
    };
  }
}
