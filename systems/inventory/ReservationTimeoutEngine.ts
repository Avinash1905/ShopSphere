export interface StockHold {
  holdId: string;
  sku: string;
  quantity: number;
  warehouseId: string;
  expiresAt: number;
  userId: string;
}

export class ReservationTimeoutEngine {
  private holds: Map<string, StockHold> = new Map();
  private defaultTtlMs: number;

  constructor(defaultTtlSeconds: number = 900) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  public createHold(sku: string, quantity: number, warehouseId: string, userId: string, customTtlSeconds?: number): StockHold {
    const holdId = `hold_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const ttl = (customTtlSeconds ? customTtlSeconds * 1000 : this.defaultTtlMs);
    const hold: StockHold = {
      holdId,
      sku,
      quantity,
      warehouseId,
      expiresAt: Date.now() + ttl,
      userId
    };
    this.holds.set(holdId, hold);
    return hold;
  }

  public releaseExpiredHolds(now: number = Date.now()): StockHold[] {
    const expired: StockHold[] = [];
    for (const [id, hold] of this.holds.entries()) {
      if (hold.expiresAt <= now) {
        expired.push(hold);
        this.holds.delete(id);
      }
    }
    return expired;
  }

  public commitHold(holdId: string): boolean {
    return this.holds.delete(holdId);
  }

  public getActiveHoldCount(): number {
    return this.holds.size;
  }
}
