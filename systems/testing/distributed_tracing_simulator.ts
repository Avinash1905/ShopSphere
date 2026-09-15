import crypto from 'crypto';

export interface TraceSpanEvent {
  name: string;
  timestampMs: number;
  attributes?: Record<string, any>;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  serviceName: string;
  startTimeMs: number;
  endTimeMs?: number;
  durationMs?: number;
  status: 'UNSET' | 'OK' | 'ERROR';
  errorMessage?: string;
  attributes: Record<string, any>;
  events: TraceSpanEvent[];
}

export class DistributedTracingSimulator {
  private spans: Map<string, TraceSpan> = new Map();

  /**
   * Generates a 128-bit Trace ID hex string
   */
  public static generateTraceId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generates a 64-bit Span ID hex string
   */
  public static generateSpanId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Starts a new span in the active trace
   */
  public startSpan(
    name: string,
    serviceName: string,
    traceId?: string,
    parentSpanId?: string,
    attributes: Record<string, any> = {}
  ): TraceSpan {
    const span: TraceSpan = {
      traceId: traceId || DistributedTracingSimulator.generateTraceId(),
      spanId: DistributedTracingSimulator.generateSpanId(),
      parentSpanId,
      name,
      serviceName,
      startTimeMs: Date.now(),
      status: 'UNSET',
      attributes: { ...attributes },
      events: [],
    };

    this.spans.set(span.spanId, span);
    return span;
  }

  /**
   * Adds an annotation event to a span
   */
  public addSpanEvent(spanId: string, eventName: string, attributes?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.events.push({
        name: eventName,
        timestampMs: Date.now(),
        attributes,
      });
    }
  }

  /**
   * Ends a span and computes total elapsed latency
   */
  public endSpan(spanId: string, status: 'OK' | 'ERROR' = 'OK', errorMessage?: string): TraceSpan {
    const span = this.spans.get(spanId);
    if (!span) {
      throw new Error(`Span '${spanId}' not found`);
    }

    span.endTimeMs = Date.now();
    span.durationMs = Math.max(0, span.endTimeMs - span.startTimeMs);
    span.status = status;
    if (errorMessage) span.errorMessage = errorMessage;

    return span;
  }

  /**
   * Extracts the full span tree hierarchy for a Trace ID
   */
  public getTraceTree(traceId: string): TraceSpan[] {
    return Array.from(this.spans.values())
      .filter((s) => s.traceId === traceId)
      .sort((a, b) => a.startTimeMs - b.startTimeMs);
  }

  public getSpanCount(): number {
    return this.spans.size;
  }

  public clear(): void {
    this.spans.clear();
  }
}
