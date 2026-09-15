export interface StockDepletionEvent {
  sku: string;
  quantityDecremented: number;
  timestampMs: number;
  orderId: string;
  remainingStock: number;
}

export interface InventoryTelemetrySummary {
  sku: string;
  currentAvailableStock: number;
  unitsSoldPast24h: number;
  hourlyDepletionRate: number;
  estimatedHoursToStockout: number;
  isHighVelocitySpike: boolean; // Velocity > 3x rolling average
  stockoutUrgency: 'CRITICAL' | 'WARNING' | 'NORMAL';
}

export class RealtimeInventoryTelemetry {
  private events: Map<string, StockDepletionEvent[]> = new Map();
  private currentStock: Map<string, number> = new Map();

  /**
   * Records a stock depletion event
   */
  public recordDepletion(event: StockDepletionEvent): void {
    if (!this.events.has(event.sku)) {
      this.events.set(event.sku, []);
    }
    this.events.get(event.sku)!.push(event);
    this.currentStock.set(event.sku, event.remainingStock);
  }

  /**
   * Evaluates real-time telemetry metrics and stockout alarms for a SKU
   */
  public evaluateTelemetry(sku: string, asOfMs: number = Date.now()): InventoryTelemetrySummary {
    const skuEvents = this.events.get(sku) || [];
    const stock = this.currentStock.get(sku) || 0;

    const past24hMs = asOfMs - 24 * 60 * 60 * 1000;
    const past1hMs = asOfMs - 60 * 60 * 1000;

    const events24h = skuEvents.filter((e) => e.timestampMs >= past24hMs && e.timestampMs <= asOfMs);
    const events1h = skuEvents.filter((e) => e.timestampMs >= past1hMs && e.timestampMs <= asOfMs);

    const units24h = events24h.reduce((acc, e) => acc + e.quantityDecremented, 0);
    const units1h = events1h.reduce((acc, e) => acc + e.quantityDecremented, 0);

    const hourlyRate = units24h > 0 ? units24h / 24 : units1h;
    const hoursToStockout = hourlyRate > 0 ? Math.round((stock / hourlyRate) * 10) / 10 : 999;

    // High velocity spike if past hour rate > 3x average hourly rate
    const isSpike = units1h > 5 && units1h >= hourlyRate * 3;

    let urgency: InventoryTelemetrySummary['stockoutUrgency'] = 'NORMAL';
    if (stock <= 5 || hoursToStockout <= 12) {
      urgency = 'CRITICAL';
    } else if (hoursToStockout <= 24) {
      urgency = 'WARNING';
    }

    return {
      sku,
      currentAvailableStock: stock,
      unitsSoldPast24h: units24h,
      hourlyDepletionRate: Math.round(hourlyRate * 100) / 100,
      estimatedHoursToStockout: hoursToStockout,
      isHighVelocitySpike: isSpike,
      stockoutUrgency: urgency,
    };
  }

  /**
   * Calculates Inventory Turnover Ratio: (Total Units Sold / Average Stock Held)
   */
  public calculateTurnoverRatio(sku: string, initialStock: number): number {
    const skuEvents = this.events.get(sku) || [];
    const totalSold = skuEvents.reduce((acc, e) => acc + e.quantityDecremented, 0);
    const currentStock = this.currentStock.get(sku) ?? initialStock;
    const avgStock = Math.max(1, (initialStock + currentStock) / 2);

    return Math.round((totalSold / avgStock) * 100) / 100;
  }
}
