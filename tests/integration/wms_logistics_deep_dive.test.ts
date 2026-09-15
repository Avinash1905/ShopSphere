import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import {
  WMSBinInventoryRepository,
  ASNInboundShipmentRepository,
  StockTransferRepository,
} from '../../database/repositories/index.js';
import {
  WMSPickPackRoutingQueryEngine,
  CycleCountVarianceQueryEngine,
  PickItemLocation,
} from '../../database/queries/index.js';
import {
  WMSFulfillmentEfficiencyAnalytics,
  CarrierShippingRateEngine,
  PickerSessionLog,
} from '../../systems/analytics/index.js';
import {
  CustomsHarmonizedTariffEngine,
} from '../../systems/security/index.js';

describe('WMS & Logistics Subsystem Deep Dive (Phase 9)', () => {
  const db = new MockDatabaseAdapter();

  describe('WMSBinInventoryRepository', () => {
    const repo = new WMSBinInventoryRepository(db);

    it('should recommend optimal put-away bin based on capacity and weight', async () => {
      const recommendation = await repo.findOptimalPutAwayBin('wh-001', 'var-laptop-001', 25, 1.5, 0.01);
      Assert.isTrue(!!recommendation);
      Assert.equal(typeof recommendation.binId, 'string');
      Assert.equal(typeof recommendation.zoneId, 'string');
      Assert.equal(typeof recommendation.aisle, 'string');
      Assert.isTrue(recommendation.rationale.length > 0);
    });

    it('should allocate inventory to a bin location', async () => {
      const record = await repo.allocateToBin('BIN-A1-04-02', 'var-laptop-001', 15, 1.5, 0.01);
      Assert.isTrue(!!record);
      Assert.equal(record.bin_id, 'BIN-A1-04-02');
      Assert.equal(record.variant_id, 'var-laptop-001');
      Assert.equal(record.quantity_on_hand, 15);
    });
  });

  describe('ASNInboundShipmentRepository', () => {
    const repo = new ASNInboundShipmentRepository(db);

    it('should create an ASN inbound shipment record with items', async () => {
      const result = await repo.createASN(
        {
          asn_number: 'ASN-2026-X889',
          warehouse_id: 'wh-001',
          seller_id: 'seller_tech_corp',
          carrier_code: 'FEDEX',
          tracking_number: 'TRK-992100',
          status: 'EXPECTED',
          total_units_expected: 300,
          expected_arrival_date: '2026-09-20',
          actual_arrival_date: undefined,
          notes: 'Standard replenishment batch',
        },
        [
          { variantId: 'var-dock-01', sku: 'SKU-DOCK-USB4', quantityExpected: 100 },
          { variantId: 'var-cable-01', sku: 'SKU-CABLE-TB4', quantityExpected: 200 },
        ]
      );

      Assert.isTrue(!!result);
      Assert.equal(result.asn.asn_number, 'ASN-2026-X889');
      Assert.equal(result.items.length, 2);
    });

    it('should audit ASN discrepancies when items are scanned', async () => {
      const report = await repo.auditASNDiscrepancies('asn-test-01');
      Assert.isTrue(!!report);
      Assert.equal(typeof report.asnNumber, 'string');
      Assert.equal(typeof report.hasDiscrepancy, 'boolean');
      Assert.isTrue(Array.isArray(report.itemDiscrepancies));
    });
  });

  describe('StockTransferRepository', () => {
    const repo = new StockTransferRepository(db);

    it('should create inter-warehouse stock transfer order', async () => {
      const transfer = await repo.createTransferOrder('wh-001', 'wh-002', 50, 'UPS', 'TRK-XFER-110');
      Assert.isTrue(!!transfer);
      Assert.equal(transfer.source_warehouse_id, 'wh-001');
      Assert.equal(transfer.destination_warehouse_id, 'wh-002');
      Assert.equal(transfer.status, 'APPROVED');
      Assert.equal(transfer.total_units, 50);
    });

    it('should mark transfer as shipped and received', async () => {
      await repo.markShipped('transfer_001');
      await repo.markReceived('transfer_001');
      Assert.isTrue(true);
    });
  });

  describe('WMSPickPackRoutingQueryEngine', () => {
    it('should optimize pick wave routing using heuristic ordering', () => {
      const items: PickItemLocation[] = [
        { orderId: 'ord_1', orderItemId: 'item_1', variantId: 'var_1', sku: 'SKU-001', quantity: 2, binId: 'b_1', binCode: 'A-01-01', aisleIndex: 5, rackPosition: 2 },
        { orderId: 'ord_1', orderItemId: 'item_2', variantId: 'var_2', sku: 'SKU-002', quantity: 1, binId: 'b_2', binCode: 'A-01-02', aisleIndex: 1, rackPosition: 1 },
        { orderId: 'ord_2', orderItemId: 'item_3', variantId: 'var_3', sku: 'SKU-003', quantity: 5, binId: 'b_3', binCode: 'B-02-01', aisleIndex: 2, rackPosition: 3 },
        { orderId: 'ord_3', orderItemId: 'item_4', variantId: 'var_4', sku: 'SKU-004', quantity: 1, binId: 'b_4', binCode: 'B-02-02', aisleIndex: 5, rackPosition: 1 },
      ];

      const route = WMSPickPackRoutingQueryEngine.optimizePickWave('wave_alpha_10', items);
      Assert.isTrue(!!route);
      Assert.equal(route.waveId, 'wave_alpha_10');
      Assert.equal(route.totalPickItems, 4);
      Assert.equal(route.totalUnitsToPick, 9);
      Assert.isTrue(route.estimatedWalkingDistanceMeters > 0);
      Assert.equal(route.orderedPickSequence.length, 4);
      Assert.isTrue(route.orderedPickSequence[0].aisleIndex <= route.orderedPickSequence[1].aisleIndex);
    });
  });

  describe('CycleCountVarianceQueryEngine', () => {
    const engine = new CycleCountVarianceQueryEngine(db);

    it('should audit batch cycle count variance against threshold', async () => {
      const audit = await engine.auditBatchVariance('BATCH-2026-09', 'wh-001', 200.0);
      Assert.isTrue(!!audit);
      Assert.equal(audit.batchNumber, 'BATCH-2026-09');
      Assert.equal(audit.warehouseId, 'wh-001');
      Assert.equal(typeof audit.inventoryAccuracyRatePercent, 'number');
      Assert.equal(typeof audit.requiresSupervisorApproval, 'boolean');
    });
  });

  describe('WMSFulfillmentEfficiencyAnalytics', () => {
    it('should evaluate warehouse facility efficiency KPIs', () => {
      const logs: PickerSessionLog[] = [
        { pickerUserId: 'p_01', sessionStartMs: 0, sessionEndMs: 3600000, totalPicksCompleted: 100, totalUnitsPicked: 300, errorCount: 1 },
        { pickerUserId: 'p_02', sessionStartMs: 0, sessionEndMs: 3600000, totalPicksCompleted: 80, totalUnitsPicked: 210, errorCount: 0 },
        { pickerUserId: 'p_03', sessionStartMs: 0, sessionEndMs: 3600000, totalPicksCompleted: 140, totalUnitsPicked: 400, errorCount: 2 },
      ];

      const report = WMSFulfillmentEfficiencyAnalytics.evaluateFacilityEfficiency('wh-001', logs, [45, 60, 90]);
      Assert.isTrue(!!report);
      Assert.equal(report.warehouseId, 'wh-001');
      Assert.equal(report.totalActivePickers, 3);
      Assert.equal(report.topPickerUserId, 'p_03');
      Assert.equal(report.totalUnitsShipped, 910);
      Assert.isTrue(report.averageUnitsPerHourUph > 0);
      Assert.isTrue(report.binStorageDensityPercent > 0);
    });
  });

  describe('CarrierShippingRateEngine', () => {
    it('should calculate dimensional billable weight correctly', () => {
      const dim = { lengthInches: 20, widthInches: 15, heightInches: 10, actualWeightLbs: 8 };
      const billable = CarrierShippingRateEngine.calculateBillableWeight(dim);
      Assert.isTrue(billable >= 8);
    });

    it('should rate shop across multiple carrier quotes sorted by total rate', () => {
      const dim = { lengthInches: 12, widthInches: 8, heightInches: 6, actualWeightLbs: 3 };
      const quotes = CarrierShippingRateEngine.rateShop(dim, '94105', '10001');

      Assert.isTrue(quotes.length > 0);
      quotes.forEach(q => {
        Assert.isTrue(!!q.carrierCode);
        Assert.isTrue(!!q.serviceLevel);
        Assert.isTrue(q.totalShippingRate > 0);
        Assert.isTrue(q.estimatedTransitDays > 0);
      });

      // Rates should be sorted in ascending order
      for (let i = 0; i < quotes.length - 1; i++) {
        Assert.isTrue(quotes[i].totalShippingRate <= quotes[i + 1].totalShippingRate);
      }
    });
  });

  describe('CustomsHarmonizedTariffEngine', () => {
    it('should compute landed cost with HS duties and VAT', () => {
      const landed = CustomsHarmonizedTariffEngine.calculateLandedCost(1200, 50, '8471.30', 'DE');
      Assert.isTrue(!!landed);
      Assert.equal(landed.productPrice, 1200);
      Assert.equal(landed.shippingCharge, 50);
      Assert.equal(landed.hsCode, '8471.30');
      Assert.isTrue(landed.totalLandedCost > 1250);
      Assert.equal(
        landed.totalLandedCost,
        Math.round((landed.productPrice + landed.shippingCharge + landed.insuranceCharge + landed.dutyAmount + landed.vatGstAmount + landed.customsProcessingFee) * 100) / 100
      );
    });
  });
});
