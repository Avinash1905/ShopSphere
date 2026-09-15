export interface StreamEvent {
  eventId: string;
  eventType: string;
  timestampMs: number;
  value: number;
  dimensions?: Record<string, string>;
}

export interface WindowMetricsSummary {
  windowType: 'TUMBLING' | 'SLIDING' | 'SESSION';
  windowStartMs: number;
  windowEndMs: number;
  eventCount: number;
  sumValue: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  ewmaValue: number;
}

export class StreamingWindowAggregator {
  private events: StreamEvent[] = [];
  private ewmaAlpha: number;
  private currentEwma: number = 0;

  constructor(ewmaAlpha: number = 0.2) {
    this.ewmaAlpha = ewmaAlpha;
  }

  /**
   * Ingests a new streaming event
   */
  public ingest(event: StreamEvent): void {
    this.events.push(event);
    if (this.events.length === 1) {
      this.currentEwma = event.value;
    } else {
      this.currentEwma = this.ewmaAlpha * event.value + (1 - this.ewmaAlpha) * this.currentEwma;
    }
  }

  /**
   * Evaluates tumbling window metrics of fixed size
   */
  public computeTumblingWindows(windowSizeMs: number): WindowMetricsSummary[] {
    if (this.events.length === 0) return [];

    const sorted = [...this.events].sort((a, b) => a.timestampMs - b.timestampMs);
    const startMs = sorted[0].timestampMs;
    const endMs = sorted[sorted.length - 1].timestampMs;

    const summaries: WindowMetricsSummary[] = [];

    for (let winStart = startMs; winStart <= endMs; winStart += windowSizeMs) {
      const winEnd = winStart + windowSizeMs;
      const winEvents = sorted.filter((e) => e.timestampMs >= winStart && e.timestampMs < winEnd);

      if (winEvents.length > 0) {
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;

        for (const e of winEvents) {
          sum += e.value;
          if (e.value < min) min = e.value;
          if (e.value > max) max = e.value;
        }

        const avg = sum / winEvents.length;

        summaries.push({
          windowType: 'TUMBLING',
          windowStartMs: winStart,
          windowEndMs: winEnd,
          eventCount: winEvents.length,
          sumValue: Math.round(sum * 100) / 100,
          avgValue: Math.round(avg * 100) / 100,
          minValue: min === Infinity ? 0 : min,
          maxValue: max === -Infinity ? 0 : max,
          ewmaValue: Math.round(this.currentEwma * 100) / 100,
        });
      }
    }

    return summaries;
  }

  /**
   * Evaluates sliding window aggregation (e.g. 5-min window sliding every 1-min)
   */
  public computeSlidingWindows(windowDurationMs: number, slideIntervalMs: number): WindowMetricsSummary[] {
    if (this.events.length === 0) return [];

    const sorted = [...this.events].sort((a, b) => a.timestampMs - b.timestampMs);
    const startMs = sorted[0].timestampMs;
    const endMs = sorted[sorted.length - 1].timestampMs;

    const summaries: WindowMetricsSummary[] = [];

    for (let winStart = startMs; winStart <= endMs; winStart += slideIntervalMs) {
      const winEnd = winStart + windowDurationMs;
      const winEvents = sorted.filter((e) => e.timestampMs >= winStart && e.timestampMs < winEnd);

      if (winEvents.length > 0) {
        const sum = winEvents.reduce((acc, e) => acc + e.value, 0);
        const avg = sum / winEvents.length;

        summaries.push({
          windowType: 'SLIDING',
          windowStartMs: winStart,
          windowEndMs: winEnd,
          eventCount: winEvents.length,
          sumValue: Math.round(sum * 100) / 100,
          avgValue: Math.round(avg * 100) / 100,
          minValue: Math.min(...winEvents.map((e) => e.value)),
          maxValue: Math.max(...winEvents.map((e) => e.value)),
          ewmaValue: Math.round(this.currentEwma * 100) / 100,
        });
      }
    }

    return summaries;
  }

  public getEventCount(): number {
    return this.events.length;
  }

  public clear(): void {
    this.events = [];
    this.currentEwma = 0;
  }
}
