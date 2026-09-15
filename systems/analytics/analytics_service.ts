import { MigrationDatabaseAdapter } from '../../database/migrations/runner.js';
import { CustomerAnalyticsService } from './customer_analytics.js';
import { SellerAnalyticsService } from './seller_analytics.js';
import { AdminAnalyticsService } from './admin_analytics.js';

export class AnalyticsService {
  public customers: CustomerAnalyticsService;
  public sellers: SellerAnalyticsService;
  public admin: AdminAnalyticsService;

  constructor(db: MigrationDatabaseAdapter) {
    this.customers = new CustomerAnalyticsService(db);
    this.sellers = new SellerAnalyticsService(db);
    this.admin = new AdminAnalyticsService(db);
  }
}
