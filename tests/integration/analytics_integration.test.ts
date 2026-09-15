import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { FixturesLoader } from '../../systems/testing/fixtures_loader.js';
import { AnalyticsService } from '../../systems/analytics/analytics_service.js';
import { MetricsCalculator } from '../../systems/analytics/metrics_calculator.js';
import { TimeSeriesEngine } from '../../systems/analytics/time_series.js';
import { CohortAnalyticsEngine } from '../../systems/analytics/cohort_analytics.js';
import { ReportExporter } from '../../systems/analytics/report_exporter.js';

describe('Analytics Engine Integration Test Suite', () => {
  it('should compute accurate statistical metrics and percentiles', () => {
    const data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    Assert.equal(MetricsCalculator.mean(data), 55, 'Mean of 10..100 is 55');
    Assert.equal(MetricsCalculator.median(data), 55, 'Median of 10..100 is 55');
    Assert.equal(MetricsCalculator.percentile(data, 50), 55, 'p50 is 55');
    Assert.greaterThan(MetricsCalculator.percentile(data, 95), 90, 'p95 is > 90');

    const clv = MetricsCalculator.customerLifetimeValue(100, 4, 3, 0.25);
    Assert.equal(clv, 300, 'CLV calculation matches formula');

    const reg = MetricsCalculator.linearRegression([10, 20, 30, 40, 50]);
    Assert.equal(reg.slope, 10, 'Linear regression slope is 10');
    Assert.equal(reg.nextProjected, 60, 'Next period projection is 60');
  });

  it('should generate time-series buckets and aggregate daily trends', () => {
    const events = [
      { date: '2026-09-01T10:00:00Z', revenue: 100 },
      { date: '2026-09-01T14:00:00Z', revenue: 150 },
      { date: '2026-09-02T11:00:00Z', revenue: 300 },
      { date: '2026-09-03T09:00:00Z', revenue: 350 },
    ];

    const points = TimeSeriesEngine.bucketItems(
      events,
      (e) => e.date,
      (e) => e.revenue,
      'DAILY'
    );

    Assert.equal(points.length, 3, '3 daily buckets created');
    Assert.equal(points[0].value, 250, 'Day 1 total revenue is 250');
    Assert.equal(points[0].count, 2, 'Day 1 event count is 2');

    const forecast = TimeSeriesEngine.forecastNextPeriod(points);
    Assert.isTrue(forecast.trend === 'UP', 'Trend direction is UP');
    Assert.greaterThan(forecast.projectedValue, 300, 'Projected value increases');
  });

  it('should compute cohort retention matrices across signup cohorts', () => {
    const cohortRecords = [
      { userId: 'u1', signupMonth: '2026-01', activityMonth: '2026-01', spend: 100 },
      { userId: 'u1', signupMonth: '2026-01', activityMonth: '2026-02', spend: 50 },
      { userId: 'u2', signupMonth: '2026-01', activityMonth: '2026-01', spend: 200 },
      { userId: 'u3', signupMonth: '2026-02', activityMonth: '2026-02', spend: 150 },
    ];

    const matrix = CohortAnalyticsEngine.computeRetentionMatrix(cohortRecords);
    Assert.equal(matrix.cohorts.length, 2, '2 cohorts generated');

    const janCohort = matrix.cohorts.find((c) => c.cohortMonth === '2026-01');
    Assert.isNotNull(janCohort, 'Jan cohort exists');
    Assert.equal(janCohort!.initialSize, 2, 'Jan cohort size is 2');
    Assert.equal(janCohort!.retentionRates[0], 100, 'Month 0 retention is 100%');
    Assert.equal(janCohort!.retentionRates[1], 50, 'Month 1 retention is 50% (1 of 2 retained)');
  });

  it('should execute Customer, Seller, and Admin analytics dashboards against database', async () => {
    const { db } = await FixturesLoader.setupTestDatabase();
    const analytics = new AnalyticsService(db);

    // 1. Customer analytics
    const custProfile = await analytics.customers.getCustomerAnalytics('usr-cust-01');
    Assert.isNotNull(custProfile, 'Customer analytics profile returned');
    Assert.greaterThan(custProfile!.totalOrders, 0, 'Customer has recorded orders');

    // 2. Seller analytics
    const sellerDashboard = await analytics.sellers.getSellerDashboard('seller-apple');
    Assert.isNotNull(sellerDashboard, 'Seller dashboard returned');
    Assert.equal(sellerDashboard!.storeName, 'Apple Authorized Premium Reseller', 'Store name matches');

    // 3. Admin dashboard
    const adminDashboard = await analytics.admin.getExecutiveDashboard();
    Assert.greaterThan(adminDashboard.overview.totalUsers, 0, 'Admin overview total users > 0');
    Assert.greaterThan(adminDashboard.overview.totalProducts, 0, 'Admin overview total products > 0');
    Assert.equal(adminDashboard.systemHealth.databaseStatus, 'HEALTHY', 'System health status is HEALTHY');

    // 4. Report Exporter
    const csv = ReportExporter.exportDataset(
      adminDashboard.topPerformingSellers,
      ['sellerId', 'storeName', 'revenue', 'salesCount', 'rating'],
      'CSV'
    );
    Assert.isTrue(csv.includes('storeName'), 'CSV contains header');
  });
});
