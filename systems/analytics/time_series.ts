import { MetricsCalculator } from './metrics_calculator.js';

export type TimeGranularity = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface TimeSeriesPoint {
  bucket: string;
  timestamp: string;
  value: number;
  count: number;
}

export class TimeSeriesEngine {
  public static bucketItems<T>(
    items: T[],
    dateSelector: (item: T) => string | Date,
    valueSelector: (item: T) => number,
    granularity: TimeGranularity = 'DAILY',
    fillGaps: boolean = true
  ): TimeSeriesPoint[] {
    const bucketMap = new Map<string, { valueSum: number; count: number; minDate: string }>();

    for (const item of items) {
      const rawDate = dateSelector(item);
      let bucketKey = '';
      let minDate = '';

      if (typeof rawDate === 'string' && granularity === 'DAILY' && rawDate.length >= 10) {
        bucketKey = rawDate.substring(0, 10);
        minDate = rawDate;
      } else {
        const d = typeof rawDate === 'string' ? new Date(rawDate) : rawDate;
        if (isNaN(d.getTime())) continue;
        bucketKey = this.formatBucketKey(d, granularity);
        minDate = d.toISOString();
      }

      const val = valueSelector(item);

      let entry = bucketMap.get(bucketKey);
      if (!entry) {
        entry = { valueSum: 0, count: 0, minDate };
        bucketMap.set(bucketKey, entry);
      }
      entry.valueSum += val;
      entry.count++;
    }

    const points: TimeSeriesPoint[] = Array.from(bucketMap.entries())
      .map(([bucket, data]) => ({
        bucket,
        timestamp: data.minDate,
        value: Math.round(data.valueSum * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));

    return points;
  }

  public static forecastNextPeriod(points: TimeSeriesPoint[]): { projectedValue: number; trend: 'UP' | 'DOWN' | 'FLAT' } {
    const values = points.map((p) => p.value);
    const regression = MetricsCalculator.linearRegression(values);

    let trend: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
    if (regression.slope > 0.5) trend = 'UP';
    else if (regression.slope < -0.5) trend = 'DOWN';

    return {
      projectedValue: regression.nextProjected,
      trend,
    };
  }

  private static formatBucketKey(date: Date, granularity: TimeGranularity): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());
    const h = pad(date.getUTCHours());

    switch (granularity) {
      case 'HOURLY':
        return `${y}-${m}-${d} ${h}:00`;
      case 'DAILY':
        return `${y}-${m}-${d}`;
      case 'WEEKLY': {
        const weekNum = this.getWeekNumber(date);
        return `${y}-W${pad(weekNum)}`;
      }
      case 'MONTHLY':
        return `${y}-${m}`;
      case 'YEARLY':
        return `${y}`;
    }
  }

  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
