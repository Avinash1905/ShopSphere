/**
 * Test Suite: Advanced Analytics Subsystem Integration Test
 */

import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { RFMSegmentationEngine, CustomerRFMInput } from '../../systems/analytics/rfm_segmentation.js';
import { OLAPCubeEngine, OLAPTransactionFact } from '../../systems/analytics/olap_cube_engine.js';
import { FunnelDropoffAnalyzer, TouchpointEvent } from '../../systems/analytics/funnel_dropoff_analyzer.js';
import { DemandForecaster } from '../../systems/analytics/demand_forecaster.js';
import { StreamAnomalyDetector } from '../../systems/analytics/anomaly_detector.js';

describe('Advanced Analytics Subsystem Test Suite', () => {
  it('should compute quintile RFM segmentation and assign customer segments', () => {
    const refDate = new Date('2026-09-15T00:00:00Z');
    const customers: CustomerRFMInput[] = [
      { customerId: 'c1', lastOrderDate: new Date('2026-09-14T00:00:00Z'), orderCount: 25, totalSpend: 5000 }, // Champion
      { customerId: 'c2', lastOrderDate: new Date('2026-09-10T00:00:00Z'), orderCount: 15, totalSpend: 2500 }, // Loyal
      { customerId: 'c3', lastOrderDate: new Date('2026-03-01T00:00:00Z'), orderCount: 12, totalSpend: 3000 }, // At Risk
      { customerId: 'c4', lastOrderDate: new Date('2025-01-01T00:00:00Z'), orderCount: 1, totalSpend: 50 },    // Lost
    ];

    const rfmScores = RFMSegmentationEngine.calculateRFM(customers, refDate);
    Assert.equal(rfmScores.length, 4);

    const c1Score = rfmScores.find((s) => s.customerId === 'c1')!;
    Assert.equal(c1Score.segment, 'CHAMPIONS');
    Assert.isTrue(c1Score.rScore >= 4);

    const c4Score = rfmScores.find((s) => s.customerId === 'c4')!;
    Assert.equal(c4Score.segment, 'LOST');
  });

  it('should execute slice, dice, and rollup operations on OLAP cube', () => {
    const facts: OLAPTransactionFact[] = [
      { year: 2026, month: 9, category: 'Electronics', region: 'US-West', sellerId: 's1', revenue: 1000, units: 5 },
      { year: 2026, month: 9, category: 'Electronics', region: 'US-East', sellerId: 's1', revenue: 1500, units: 8 },
      { year: 2026, month: 9, category: 'Fashion', region: 'US-West', sellerId: 's2', revenue: 500, units: 10 },
      { year: 2026, month: 8, category: 'Electronics', region: 'US-West', sellerId: 's1', revenue: 800, units: 4 },
    ];

    const cube = new OLAPCubeEngine();
    cube.loadFacts(facts);

    // Slice along Electronics
    const electronicsCube = cube.slice('category', 'Electronics');
    const rolledUp = electronicsCube.rollup(['region']);

    Assert.isTrue(rolledUp.has('US-West'));
    Assert.isTrue(rolledUp.has('US-East'));
    Assert.equal(rolledUp.get('US-West')!.revenue, 1800); // 1000 + 800
    Assert.equal(rolledUp.get('US-East')!.revenue, 1500);
  });

  it('should calculate conversion funnel drop-off and multi-touch marketing attribution', () => {
    const stages = [
      { name: 'Product Impressions', userCount: 10000 },
      { name: 'Product Views', userCount: 4000 },
      { name: 'Add to Cart', userCount: 1000 },
      { name: 'Checkout Initiated', userCount: 400 },
      { name: 'Purchased', userCount: 200 },
    ];

    const funnel = FunnelDropoffAnalyzer.calculateFunnel(stages);
    Assert.equal(funnel.length, 5);
    Assert.equal(funnel[funnel.length - 1].conversionRateFromStart, 2.0); // 200 / 10000 = 2%

    // Multi-touch attribution
    const events: TouchpointEvent[] = [
      { userId: 'u1', channel: 'paid_ads', timestamp: new Date('2026-09-01'), isConversion: false },
      { userId: 'u1', channel: 'email', timestamp: new Date('2026-09-05'), isConversion: false },
      { userId: 'u1', channel: 'direct', timestamp: new Date('2026-09-10'), isConversion: true, revenue: 100 },
    ];

    const linearAttribution = FunnelDropoffAnalyzer.attributeRevenue(events, 'LINEAR');
    Assert.equal(linearAttribution.get('paid_ads'), 50); // 2 touchpoints -> 50 each
    Assert.equal(linearAttribution.get('email'), 50);

    const firstTouchAttribution = FunnelDropoffAnalyzer.attributeRevenue(events, 'FIRST_TOUCH');
    Assert.equal(firstTouchAttribution.get('paid_ads'), 100);
  });

  it('should forecast inventory demand and calculate Reorder Point (ROP)', () => {
    const dailyDemand = [20, 22, 25, 24, 28, 30, 35, 34, 38, 40, 42, 45, 50, 48];
    const forecast = DemandForecaster.forecast(dailyDemand, 5);

    Assert.equal(forecast.length, 5);
    Assert.greaterThan(forecast[4].forecast, forecast[0].forecast); // Upward trend

    const rop = DemandForecaster.calculateReorderPoint(dailyDemand, 7, 1.65);
    Assert.greaterThan(rop.avgDailyDemand, 30);
    Assert.greaterThan(rop.reorderPoint, rop.avgDailyDemand * 7);
  });

  it('should detect statistical anomalies and generate severity alerts', () => {
    const historicalFailures = [2, 3, 2, 4, 3, 2, 3, 4, 3, 2, 3]; // Normal baseline: ~3
    const spike = 25; // 25 is huge anomaly

    const report = StreamAnomalyDetector.detectZScoreAnomaly('payment_failures', spike, historicalFailures, 3.0);
    Assert.isTrue(report.isAnomaly);
    Assert.isTrue(report.severity === 'CRITICAL' || report.severity === 'HIGH');
    Assert.greaterThan(report.zScore, 3.0);
  });
});
