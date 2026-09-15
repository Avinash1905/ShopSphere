export interface DimDateRecord {
  dateKey: number; // e.g. 20260915
  fullDate: string;
  year: number;
  quarter: number;
  month: number;
  weekOfYear: number;
  dayOfWeek: number;
  isWeekend: boolean;
}

export interface DimProductRecord {
  productKey: string;
  productId: string;
  sku: string;
  title: string;
  category: string;
  brand: string;
  unitCost: number;
  listPrice: number;
}

export interface FactOrderLineItemRecord {
  orderLineKey: string;
  orderId: string;
  dateKey: number;
  customerKey: string;
  productKey: string;
  sellerKey: string;
  quantity: number;
  grossSales: number;
  discountAmount: number;
  netRevenue: number;
  totalCogs: number;
  grossMarginDollars: number;
  marginPercent: number;
}

export class DataWarehouseStarSchemaBuilder {
  /**
   * Generates a deterministic Date Dimension record from timestamp
   */
  public static generateDimDate(dateStr: string): DimDateRecord {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dateKey = year * 10000 + month * 100 + day;

    const quarter = Math.ceil(month / 3);
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Approximate ISO week of year
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
    const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    return {
      dateKey,
      fullDate: d.toISOString().substring(0, 10),
      year,
      quarter,
      month,
      weekOfYear: week,
      dayOfWeek,
      isWeekend,
    };
  }

  /**
   * Transforms raw transactional order item into star schema Fact record
   */
  public static transformToFactLineItem(rawItem: {
    orderLineId: string;
    orderId: string;
    createdAt: string;
    userId: string;
    productId: string;
    sellerId: string;
    quantity: number;
    unitPrice: number;
    itemDiscount: number;
    unitCost?: number;
  }): FactOrderLineItemRecord {
    const dimDate = DataWarehouseStarSchemaBuilder.generateDimDate(rawItem.createdAt);
    const gross = Math.round(rawItem.quantity * rawItem.unitPrice * 100) / 100;
    const discount = Math.round(rawItem.itemDiscount * 100) / 100;
    const net = Math.round((gross - discount) * 100) / 100;

    const cost = rawItem.unitCost || rawItem.unitPrice * 0.6;
    const totalCogs = Math.round(rawItem.quantity * cost * 100) / 100;
    const margin = Math.round((net - totalCogs) * 100) / 100;
    const marginPct = net > 0 ? Math.round((margin / net) * 10000) / 100 : 0;

    return {
      orderLineKey: `FACT-${rawItem.orderLineId}`,
      orderId: rawItem.orderId,
      dateKey: dimDate.dateKey,
      customerKey: `DIM-CUST-${rawItem.userId}`,
      productKey: `DIM-PROD-${rawItem.productId}`,
      sellerKey: `DIM-SELLER-${rawItem.sellerId}`,
      quantity: rawItem.quantity,
      grossSales: gross,
      discountAmount: discount,
      netRevenue: net,
      totalCogs,
      grossMarginDollars: margin,
      marginPercent: marginPct,
    };
  }
}
