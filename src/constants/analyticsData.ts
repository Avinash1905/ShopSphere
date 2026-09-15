import { SalesDataPoint, CategorySalesDataPoint, TopProductPerformance, UserGrowthDataPoint, TrafficSourceDataPoint } from '../types';

export const MOCK_SALES_TRENDS: SalesDataPoint[] = [
  { date: '2024-02-01', revenue: 14200, orders: 84, unitsSold: 112, averageOrderValue: 169.05 },
  { date: '2024-02-02', revenue: 18450, orders: 98, unitsSold: 140, averageOrderValue: 188.27 },
  { date: '2024-02-03', revenue: 22100, orders: 120, unitsSold: 175, averageOrderValue: 184.17 },
  { date: '2024-02-04', revenue: 26800, orders: 145, unitsSold: 210, averageOrderValue: 184.83 },
  { date: '2024-02-05', revenue: 19400, orders: 105, unitsSold: 152, averageOrderValue: 184.76 },
  { date: '2024-02-06', revenue: 24300, orders: 130, unitsSold: 190, averageOrderValue: 186.92 },
  { date: '2024-02-07', revenue: 31200, orders: 165, unitsSold: 245, averageOrderValue: 189.09 },
  { date: '2024-02-08', revenue: 29800, orders: 158, unitsSold: 232, averageOrderValue: 188.61 },
  { date: '2024-02-09', revenue: 34500, orders: 180, unitsSold: 270, averageOrderValue: 191.67 },
  { date: '2024-02-10', revenue: 41200, orders: 215, unitsSold: 320, averageOrderValue: 191.63 },
  { date: '2024-02-11', revenue: 38900, orders: 198, unitsSold: 295, averageOrderValue: 196.46 },
  { date: '2024-02-12', revenue: 36200, orders: 185, unitsSold: 278, averageOrderValue: 195.68 },
  { date: '2024-02-13', revenue: 44100, orders: 225, unitsSold: 340, averageOrderValue: 196.00 },
  { date: '2024-02-14', revenue: 52400, orders: 270, unitsSold: 410, averageOrderValue: 194.07 },
];

export const MOCK_CATEGORY_SALES: CategorySalesDataPoint[] = [
  { categoryName: 'Electronics & Gadgets', revenue: 482000, percentage: 42, orderCount: 2410, color: '#0F8EE9' },
  { categoryName: 'Fashion & Apparel', revenue: 285000, percentage: 25, orderCount: 3120, color: '#EC4899' },
  { categoryName: 'Home & Living', revenue: 194000, percentage: 17, orderCount: 1250, color: '#10B981' },
  { categoryName: 'Beauty & Wellness', revenue: 112000, percentage: 10, orderCount: 1680, color: '#F59E0B' },
  { categoryName: 'Gaming & Others', revenue: 68000, percentage: 6, orderCount: 780, color: '#8B5CF6' },
];

export const MOCK_TOP_PRODUCTS: TopProductPerformance[] = [
  {
    productId: 'prod-iphone-15-pro',
    productTitle: 'Apple iPhone 15 Pro Max - Titanium',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
    category: 'Electronics',
    unitsSold: 342,
    totalRevenue: 410058,
    stockRemaining: 48,
    conversionRate: 4.8,
  },
  {
    productId: 'prod-sony-wh1000xm5',
    productTitle: 'Sony WH-1000XM5 Wireless Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&auto=format&fit=crop&q=80',
    category: 'Electronics',
    unitsSold: 284,
    totalRevenue: 98832,
    stockRemaining: 64,
    conversionRate: 5.2,
  },
  {
    productId: 'prod-nike-air-jordan-1',
    productTitle: 'Nike Air Jordan 1 Retro High OG - Chicago',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
    category: 'Fashion',
    unitsSold: 419,
    totalRevenue: 75420,
    stockRemaining: 32,
    conversionRate: 6.1,
  },
];

export const MOCK_USER_GROWTH: UserGrowthDataPoint[] = [
  { period: 'Sep 2023', customers: 4200, sellers: 120, totalActive: 4320 },
  { period: 'Oct 2023', customers: 5800, sellers: 165, totalActive: 5965 },
  { period: 'Nov 2023', customers: 8400, sellers: 210, totalActive: 8610 },
  { period: 'Dec 2023', customers: 12900, sellers: 280, totalActive: 13180 },
  { period: 'Jan 2024', customers: 16800, sellers: 340, totalActive: 17140 },
  { period: 'Feb 2024', customers: 21400, sellers: 410, totalActive: 21810 },
];

export const MOCK_TRAFFIC_SOURCES: TrafficSourceDataPoint[] = [
  { channel: 'Direct Search', visitors: 48200, percentage: 38, conversions: 2410 },
  { channel: 'Organic SEO', visitors: 39400, percentage: 31, conversions: 1970 },
  { channel: 'Social Media & Influencers', visitors: 22800, percentage: 18, conversions: 1140 },
  { channel: 'Email Marketing & Push', visitors: 11400, percentage: 9, conversions: 798 },
  { channel: 'Referral & Affiliates', visitors: 5100, percentage: 4, conversions: 357 },
];
