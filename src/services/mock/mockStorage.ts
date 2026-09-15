import {
  MOCK_PRODUCTS,
  MOCK_USERS,
  MOCK_ORDERS,
  MOCK_COUPONS,
  MOCK_REVIEWS,
  MOCK_NOTIFICATIONS,
  MOCK_AUDIT_LOGS,
  MOCK_SELLERS,
  MOCK_CATEGORIES,
  MOCK_BRANDS,
} from '../../constants';
import {
  Product,
  User,
  Order,
  Coupon,
  ProductReview,
  Notification,
  AuditLog,
  SellerProfile,
  Category,
  Brand,
  PlatformSettings,
} from '../../types';

const STORAGE_KEYS = {
  PRODUCTS: 'shopsphere_mock_products',
  USERS: 'shopsphere_mock_users',
  ORDERS: 'shopsphere_mock_orders',
  COUPONS: 'shopsphere_mock_coupons',
  REVIEWS: 'shopsphere_mock_reviews',
  NOTIFICATIONS: 'shopsphere_mock_notifications',
  AUDIT_LOGS: 'shopsphere_mock_audit_logs',
  SELLERS: 'shopsphere_mock_sellers',
  CATEGORIES: 'shopsphere_mock_categories',
  BRANDS: 'shopsphere_mock_brands',
  SETTINGS: 'shopsphere_mock_settings',
  CART: 'shopsphere_mock_cart',
  WISHLIST: 'shopsphere_mock_wishlist',
};

const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: 'ShopSphere',
  siteUrl: 'https://shopsphere.market',
  supportEmail: 'support@shopsphere.market',
  supportPhone: '+1 (800) 555-0199',
  defaultCurrency: 'USD',
  taxRatePercentage: 8.5,
  standardShippingFee: 9.99,
  freeShippingThreshold: 75.0,
  defaultCommissionRate: 8.5,
  maintenanceMode: false,
  allowGuestCheckout: true,
  enableUserRegistration: true,
  enableSellerRegistration: true,
  maxUploadSizeMb: 15,
  refundWindowDays: 30,
  autoApproveSellerProducts: false,
};

class MockStorage {
  constructor() {
    this.init();
  }

  public init() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.set(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, MOCK_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      this.set(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
      this.set(STORAGE_KEYS.COUPONS, MOCK_COUPONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      this.set(STORAGE_KEYS.REVIEWS, MOCK_REVIEWS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.set(STORAGE_KEYS.AUDIT_LOGS, MOCK_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SELLERS)) {
      this.set(STORAGE_KEYS.SELLERS, MOCK_SELLERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.set(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BRANDS)) {
      this.set(STORAGE_KEYS.BRANDS, MOCK_BRANDS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
  }

  public get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  public set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Failed to write to mock localStorage', err);
    }
  }

  // Domain accessors
  public getProducts(): Product[] {
    return this.get<Product>(STORAGE_KEYS.PRODUCTS);
  }
  public saveProducts(products: Product[]): void {
    this.set(STORAGE_KEYS.PRODUCTS, products);
  }

  public getUsers(): User[] {
    return this.get<User>(STORAGE_KEYS.USERS);
  }
  public saveUsers(users: User[]): void {
    this.set(STORAGE_KEYS.USERS, users);
  }

  public getOrders(): Order[] {
    return this.get<Order>(STORAGE_KEYS.ORDERS);
  }
  public saveOrders(orders: Order[]): void {
    this.set(STORAGE_KEYS.ORDERS, orders);
  }

  public getCoupons(): Coupon[] {
    return this.get<Coupon>(STORAGE_KEYS.COUPONS);
  }
  public saveCoupons(coupons: Coupon[]): void {
    this.set(STORAGE_KEYS.COUPONS, coupons);
  }

  public getReviews(): ProductReview[] {
    return this.get<ProductReview>(STORAGE_KEYS.REVIEWS);
  }
  public saveReviews(reviews: ProductReview[]): void {
    this.set(STORAGE_KEYS.REVIEWS, reviews);
  }

  public getNotifications(): Notification[] {
    return this.get<Notification>(STORAGE_KEYS.NOTIFICATIONS);
  }
  public saveNotifications(notifications: Notification[]): void {
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
  }
  public saveAuditLogs(logs: AuditLog[]): void {
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  public getSellers(): SellerProfile[] {
    return this.get<SellerProfile>(STORAGE_KEYS.SELLERS);
  }
  public saveSellers(sellers: SellerProfile[]): void {
    this.set(STORAGE_KEYS.SELLERS, sellers);
  }

  public getCategories(): Category[] {
    return this.get<Category>(STORAGE_KEYS.CATEGORIES);
  }

  public getBrands(): Brand[] {
    return this.get<Brand>(STORAGE_KEYS.BRANDS);
  }

  public getSettings(): PlatformSettings {
    return this.getItem<PlatformSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
  public saveSettings(settings: PlatformSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // Simulated latency helper
  public async delay(ms = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockStorage = new MockStorage();
