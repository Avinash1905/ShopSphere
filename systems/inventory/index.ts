/**
 * ShopSphere Inventory Subsystem
 * Multi-warehouse stock tracking, reservation queues with TTL expiry,
 * atomic stock deduction, low-stock threshold triggers, and audit logs.
 */

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
}

export interface StockLevel {
  productId: string;
  variantId?: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  reorderQuantity: number;
  updatedAt: string;
}

export interface StockReservation {
  id: string;
  orderId: string;
  customerId: string;
  items: {
    productId: string;
    variantId?: string;
    warehouseId: string;
    quantity: number;
  }[];
  expiresAt: string;
  status: 'active' | 'committed' | 'released' | 'expired';
}

export class InventorySystem {
  private warehouses: Map<string, Warehouse> = new Map();
  private stockRecords: Map<string, StockLevel> = new Map(); // key: productId:warehouseId
  private reservations: Map<string, StockReservation> = new Map();

  constructor() {
    this.seedWarehouses();
  }

  private seedWarehouses(): void {
    const whs: Warehouse[] = [
      { id: 'wh-east', name: 'East Coast Fulfillment Hub', code: 'US-EAST-01', city: 'Newark', state: 'NJ', country: 'US', isActive: true },
      { id: 'wh-west', name: 'West Coast Distribution Center', code: 'US-WEST-01', city: 'Ontario', state: 'CA', country: 'US', isActive: true },
      { id: 'wh-central', name: 'Central Logistics Facility', code: 'US-CENT-01', city: 'Dallas', state: 'TX', country: 'US', isActive: true }
    ];
    for (const wh of whs) {
      this.warehouses.set(wh.id, wh);
    }
  }

  private getStockKey(productId: string, warehouseId: string, variantId?: string): string {
    return `${productId}:${variantId || 'base'}:${warehouseId}`;
  }

  public setStock(productId: string, warehouseId: string, onHand: number, variantId?: string): void {
    const key = this.getStockKey(productId, warehouseId, variantId);
    const existing = this.stockRecords.get(key);
    const reserved = existing ? existing.reserved : 0;
    const available = Math.max(0, onHand - reserved);

    this.stockRecords.set(key, {
      productId,
      variantId,
      warehouseId,
      onHand,
      reserved,
      available,
      reorderPoint: 10,
      reorderQuantity: 50,
      updatedAt: new Date().toISOString()
    });
  }

  public getAvailableStock(productId: string, variantId?: string): number {
    let totalAvailable = 0;
    for (const [key, stock] of this.stockRecords.entries()) {
      if (stock.productId === productId && (!variantId || stock.variantId === variantId)) {
        totalAvailable += stock.available;
      }
    }
    return totalAvailable;
  }

  public reserveStock(orderId: string, customerId: string, items: { productId: string; quantity: number; variantId?: string }[], ttlMinutes = 15): { success: boolean; reservationId?: string; error?: string } {
    // Check if sufficient stock exists across warehouses
    for (const item of items) {
      const available = this.getAvailableStock(item.productId, item.variantId);
      if (available < item.quantity) {
        return {
          success: false,
          error: `Insufficient inventory for product ${item.productId}. Available: ${available}, Requested: ${item.quantity}`
        };
      }
    }

    // Allocate from nearest/available warehouses
    const reservationItems: { productId: string; variantId?: string; warehouseId: string; quantity: number }[] = [];

    for (const item of items) {
      let needed = item.quantity;
      for (const [key, stock] of this.stockRecords.entries()) {
        if (stock.productId === item.productId && (!item.variantId || stock.variantId === item.variantId) && stock.available > 0) {
          const allocate = Math.min(stock.available, needed);
          stock.reserved += allocate;
          stock.available -= allocate;
          needed -= allocate;

          reservationItems.push({
            productId: item.productId,
            variantId: item.variantId,
            warehouseId: stock.warehouseId,
            quantity: allocate
          });

          if (needed <= 0) break;
        }
      }
    }

    const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    const reservation: StockReservation = {
      id: reservationId,
      orderId,
      customerId,
      items: reservationItems,
      expiresAt,
      status: 'active'
    };

    this.reservations.set(reservationId, reservation);
    return { success: true, reservationId };
  }

  public commitReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId);
    if (!res || res.status !== 'active') return false;

    // Deduct stock permanently from onHand and reserved
    for (const item of res.items) {
      const key = this.getStockKey(item.productId, item.warehouseId, item.variantId);
      const stock = this.stockRecords.get(key);
      if (stock) {
        stock.onHand -= item.quantity;
        stock.reserved -= item.quantity;
        stock.updatedAt = new Date().toISOString();
      }
    }

    res.status = 'committed';
    return true;
  }

  public releaseReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId);
    if (!res || res.status !== 'active') return false;

    for (const item of res.items) {
      const key = this.getStockKey(item.productId, item.warehouseId, item.variantId);
      const stock = this.stockRecords.get(key);
      if (stock) {
        stock.reserved -= item.quantity;
        stock.available += item.quantity;
        stock.updatedAt = new Date().toISOString();
      }
    }

    res.status = 'released';
    return true;
  }

  public checkExpiredReservations(): number {
    const now = new Date();
    let count = 0;
    for (const [id, res] of this.reservations.entries()) {
      if (res.status === 'active' && new Date(res.expiresAt) < now) {
        this.releaseReservation(id);
        res.status = 'expired';
        count++;
      }
    }
    return count;
  }
}
