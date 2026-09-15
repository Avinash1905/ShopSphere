import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import {
  StreamingWindowAggregator,
  RealtimeInventoryTelemetry,
  MarketplaceRevenueAllocator,
  AttributionModelingEngine,
  RetentionDecayCurveModeler,
  SellerReputationScoringEngine,
  AnomalyRootCauseAnalyzer,
  CLVPredictiveBayesianModel,
  CouponElasticitySimulator,
  DataWarehouseStarSchemaBuilder,
} from '../../systems/analytics/index.js';

describe('Phase 6: Analytics & Real-Time Aggregation Pipeline', () => {
  it('should calculate tumbling and sliding streaming windows with EWMA via StreamingWindowAggregator', () => {
    const agg = new StreamingWindowAggregator(0.3);
    const baseTime = 1700000000000;

    agg.ingest({ eventId: 'e1', eventType: 'ORDER_PLACED', timestampMs: baseTime + 10000, value: 100 });
    agg.ingest({ eventId: 'e2', eventType: 'ORDER_PLACED', timestampMs: baseTime + 20000, value: 200 });
    agg.ingest({ eventId: 'e3', eventType: 'ORDER_PLACED', timestampMs: baseTime + 70000, value: 300 });

    const tumbling = agg.computeTumblingWindows(60000); // 1-minute tumbling windows
    Assert.greaterThanOrEqual(tumbling.length, 2);
    Assert.equal(tumbling[0].eventCount, 2);
    Assert.equal(tumbling[0].sumValue, 300);
    Assert.equal(tumbling[0].avgValue, 150);

    const sliding = agg.computeSlidingWindows(60000, 30000); // 1-min duration, 30s slide
    Assert.greaterThan(sliding.length, 0);
  });

  it('should record depletion events and detect stockout urgency via RealtimeInventoryTelemetry', () => {
    const telemetry = new RealtimeInventoryTelemetry();
    const now = Date.now();

    telemetry.recordDepletion({
      sku: 'SKU-IPHONE-16',
      quantityDecremented: 5,
      timestampMs: now - 30 * 60 * 1000, // 30m ago
      orderId: 'ord-1',
      remainingStock: 10,
    });
    telemetry.recordDepletion({
      sku: 'SKU-IPHONE-16',
      quantityDecremented: 6,
      timestampMs: now - 10 * 60 * 1000, // 10m ago
      orderId: 'ord-2',
      remainingStock: 4,
    });

    const summary = telemetry.evaluateTelemetry('SKU-IPHONE-16', now);
    Assert.equal(summary.currentAvailableStock, 4);
    Assert.equal(summary.unitsSoldPast24h, 11);
    Assert.equal(summary.stockoutUrgency, 'CRITICAL', 'Urgency should be CRITICAL when remaining stock <= 4');

    const turnover = telemetry.calculateTurnoverRatio('SKU-IPHONE-16', 15);
    Assert.greaterThan(turnover, 0);
  });

  it('should allocate multi-party marketplace splits and verify balanced accounting', () => {
    const result = MarketplaceRevenueAllocator.allocate({
      orderId: 'ord-100',
      sellerId: 'seller-apple',
      itemSubtotal: 1000.0,
      shippingFee: 15.0,
      taxAmount: 85.0,
      discountAmount: 100.0,
      discountCoFundPlatformShare: 0.5, // $50 platform, $50 seller
      platformTakeRate: 0.085, // 8.5%
      gatewayFeeFixed: 0.30,
      gatewayFeePercent: 0.029,
    });

    Assert.equal(result.grandTotalChargedToBuyer, 1000);
    Assert.isTrue(result.platformCommissionEarned > 0);
    Assert.isTrue(result.netSellerDisbursement > 0);
    Assert.isTrue(result.allocationVerifiedBalanced, 'Double-entry accounting balanced');
  });

  it('should compute multi-touch marketing attribution across channels via AttributionModelingEngine', () => {
    const now = Date.now();
    const journeys = [
      {
        userId: 'usr-1',
        orderId: 'ord-1',
        conversionValue: 200,
        conversionTimestampMs: now,
        touchpoints: [
          { touchpointId: 't1', channel: 'META_ADS' as const, timestampMs: now - 5 * 86400000, cost: 20 },
          { touchpointId: 't2', channel: 'ORGANIC_SEARCH' as const, timestampMs: now - 2 * 86400000, cost: 0 },
          { touchpointId: 't3', channel: 'EMAIL_MARKETING' as const, timestampMs: now - 1 * 86400000, cost: 5 },
        ],
      },
    ];

    const firstTouch = AttributionModelingEngine.attributeJourneys(journeys, 'FIRST_TOUCH');
    Assert.equal(firstTouch.META_ADS.attributedConversions, 1);
    Assert.equal(firstTouch.META_ADS.attributedRevenue, 200);

    const lastTouch = AttributionModelingEngine.attributeJourneys(journeys, 'LAST_TOUCH');
    Assert.equal(lastTouch.EMAIL_MARKETING.attributedConversions, 1);

    const linear = AttributionModelingEngine.attributeJourneys(journeys, 'LINEAR');
    Assert.equal(linear.META_ADS.attributedConversions, 0.33);

    const position = AttributionModelingEngine.attributeJourneys(journeys, 'POSITION_BASED');
    Assert.equal(position.META_ADS.attributedConversions, 0.4);
    Assert.equal(position.EMAIL_MARKETING.attributedConversions, 0.4);
    Assert.equal(position.ORGANIC_SEARCH.attributedConversions, 0.2);
  });

  it('should model power-law retention decay and compute customer lifetime days', () => {
    const model = RetentionDecayCurveModeler.modelPowerLawDecay('Cohort-2026-Q1', 1000);
    Assert.equal(model.initialCohortSize, 1000);
    Assert.equal(model.projectedRetentionCurve.length, 9);
    Assert.isTrue(model.projectedRetentionCurve[0].retentionPercent > model.projectedRetentionCurve[8].retentionPercent);

    const expectedLifetime = RetentionDecayCurveModeler.calculateExpectedLifetimeDays(model);
    Assert.greaterThan(expectedLifetime, 10);
  });

  it('should compute holistic seller reputation scorecard and award badges', () => {
    const scorecard = SellerReputationScoringEngine.evaluateScorecard({
      sellerId: 'seller-top',
      totalOrdersFulfilled: 120,
      onTimeFulfillmentCount: 118,
      orderCancellationsCount: 1,
      returnDefectsCount: 0,
      averageRating: 4.95,
      totalReviewsCount: 85,
      avgResponseTimeHours: 2.5,
      policyViolationsCount: 0,
    });

    Assert.equal(scorecard.tierStatus, 'TOP_RATED_PLUS');
    Assert.greaterThan(scorecard.overallScore, 90);
    Assert.isTrue(scorecard.eligibilityBadges.includes('TOP_RATED_PLUS'));
  });

  it('should isolate dimensional root causes using AnomalyRootCauseAnalyzer', () => {
    const observations = [
      { dimensions: { device: 'iOS', country: 'US' }, baselineMetric: 0.045, observedMetric: 0.012, volumeWeight: 1000 },
      { dimensions: { device: 'Android', country: 'US' }, baselineMetric: 0.042, observedMetric: 0.041, volumeWeight: 1000 },
      { dimensions: { device: 'Desktop', country: 'US' }, baselineMetric: 0.055, observedMetric: 0.054, volumeWeight: 2000 },
    ];

    const report = AnomalyRootCauseAnalyzer.diagnose(observations);
    Assert.isTrue(report.overallDeltaPercent < 0);
    Assert.equal(report.primarySuspectDimension, 'device');
    Assert.equal(report.primarySuspectValue, 'iOS');
    Assert.isTrue(report.explanationNarrative.includes('iOS'));
  });

  it('should predict CLV equity tiers using BG/NBD Bayesian equations', () => {
    const forecast = CLVPredictiveBayesianModel.forecastCustomerCLV({
      userId: 'usr-loyal',
      frequency: 6,
      recencyWeeks: 24,
      tenureWeeks: 26,
      monetaryValueAvg: 120,
    });

    Assert.equal(forecast.userId, 'usr-loyal');
    Assert.greaterThan(forecast.probabilityAlivePercent, 50);
    Assert.greaterThan(forecast.predicted12MonthClv, 0);
    Assert.isTrue(['TIER_1_VIP', 'TIER_2_CORE', 'TIER_3_OPPORTUNITY'].includes(forecast.customerEquitySegment));
  });

  it('should simulate promo discount elasticity and recommend optimal discount percentage', () => {
    const report = CouponElasticitySimulator.simulate(1000, 50.0, 20.0, -1.8);
    Assert.equal(report.baselineUnitSales, 1000);
    Assert.greaterThan(report.scenarios.length, 5);
    Assert.isTrue(report.recommendedDiscountPercent >= 0);
    Assert.greaterThanOrEqual(report.maximumProfitDollars, report.baselineGrossProfit);
  });

  it('should generate Date Dimensions and Star Schema Fact line items', () => {
    const dimDate = DataWarehouseStarSchemaBuilder.generateDimDate('2026-09-15T12:00:00Z');
    Assert.equal(dimDate.year, 2026);
    Assert.equal(dimDate.month, 9);
    Assert.equal(dimDate.dateKey, 20260915);

    const factItem = DataWarehouseStarSchemaBuilder.transformToFactLineItem({
      orderLineId: 'item-1',
      orderId: 'ord-1',
      createdAt: '2026-09-15T12:00:00Z',
      userId: 'usr-1',
      productId: 'prod-1',
      sellerId: 'seller-1',
      quantity: 2,
      unitPrice: 100,
      itemDiscount: 20,
      unitCost: 50,
    });

    Assert.equal(factItem.grossSales, 200);
    Assert.equal(factItem.netRevenue, 180);
    Assert.equal(factItem.totalCogs, 100);
    Assert.equal(factItem.grossMarginDollars, 80);
  });
});
