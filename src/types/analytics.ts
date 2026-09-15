export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  unitsSold: number;
  averageOrderValue: number;
}

export interface CategorySalesDataPoint {
  categoryName: string;
  revenue: number;
  percentage: number;
  orderCount: number;
  color: string;
}

export interface TopProductPerformance {
  productId: string;
  productTitle: string;
  imageUrl: string;
  category: string;
  unitsSold: number;
  totalRevenue: number;
  stockRemaining: number;
  conversionRate: number;
}

export interface UserGrowthDataPoint {
  period: string;
  customers: number;
  sellers: number;
  totalActive: number;
}

export interface TrafficSourceDataPoint {
  channel: string;
  visitors: number;
  percentage: number;
  conversions: number;
}
