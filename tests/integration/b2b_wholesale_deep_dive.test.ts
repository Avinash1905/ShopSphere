import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MockDatabaseAdapter } from '../../systems/testing/mock_database.js';
import {
  B2BCorporateAccountRepository,
  B2BQuoteRFQRepository,
} from '../../database/repositories/index.js';
import {
  B2BTieredPricingEvaluatorQueryEngine,
  B2BDunningAgingReceivablesQueryEngine,
} from '../../database/queries/index.js';
import {
  B2BWholesaleMarginOptimizer,
} from '../../systems/analytics/index.js';
import {
  B2BTaxExemptionValidator,
} from '../../systems/security/index.js';

describe('B2B Wholesale, Tiered Pricing & Net Terms Deep Dive (Phase 11)', () => {
  const db = new MockDatabaseAdapter();

  describe('B2BCorporateAccountRepository', () => {
    const repo = new B2BCorporateAccountRepository(db);

    it('should register corporate buyer account with credit limit and payment terms', async () => {
      const company = await repo.registerCompanyAccount(
        'Apex Global Tech Inc.',
        'US-123456789',
        50000.0,
        'NET_30',
        'ap@apextech.example.com',
        'CERT-TAX-CA-001'
      );

      Assert.isTrue(!!company);
      Assert.equal(company.company_name, 'Apex Global Tech Inc.');
      Assert.equal(company.credit_limit_usd, 50000.0);
      Assert.equal(company.available_credit_usd, 50000.0);
      Assert.equal(company.payment_terms, 'NET_30');
      Assert.equal(company.is_tax_exempt, true);
    });

    it('should authorize credit drawdown and reject overdraft beyond credit limit', async () => {
      const company = await repo.registerCompanyAccount(
        'Beta Retail Partners',
        'US-987654321',
        10000.0,
        'NET_15',
        'orders@betaretail.example.com'
      );

      const approved = await repo.authorizeCreditDrawdown(company.id, 4000.0);
      Assert.isTrue(approved);

      let rejected = false;
      try {
        await repo.authorizeCreditDrawdown(company.id, 8000.0); // 4000 + 8000 > 10000
      } catch (err: any) {
        rejected = true;
        Assert.isTrue(err.message.includes('Insufficient credit limit'));
      }
      Assert.isTrue(rejected);
    });

    it('should restore available credit upon corporate invoice payment', async () => {
      const company = await repo.registerCompanyAccount(
        'Gamma Logistics Corp',
        'US-555666777',
        20000.0,
        'NET_60',
        'finance@gammalog.example.com'
      );

      await repo.authorizeCreditDrawdown(company.id, 15000.0); // Available becomes 5000
      const restoredAvailable = await repo.restoreCreditOnPayment(company.id, 10000.0); // Restores to 15000
      Assert.equal(restoredAvailable, 15000.0);
    });
  });

  describe('B2BQuoteRFQRepository', () => {
    const repo = new B2BQuoteRFQRepository(db);

    it('should handle full RFQ submission, seller quote, and conversion to order', async () => {
      // 1. Submit RFQ
      const { rfq, items } = await repo.submitRFQ('corp_tech_01', 'seller_tech_01', [
        { variantId: 'var-laptop-001', sku: 'SKU-LAPTOP-16', quantityRequested: 50, targetUnitPriceUsd: 950.0 },
        { variantId: 'var-dock-001', sku: 'SKU-DOCK-TB4', quantityRequested: 50, targetUnitPriceUsd: 120.0 },
      ]);

      Assert.isTrue(!!rfq);
      Assert.equal(rfq.status, 'SUBMITTED');
      Assert.equal(rfq.requested_total_usd, 50 * 950 + 50 * 120); // 53,500
      Assert.equal(items.length, 2);

      // 2. Seller Quote
      const quoted = await repo.provideQuote({
        rfqId: rfq.id,
        quotedItems: [
          { rfqItemId: items[0].id, quotedUnitPriceUsd: 980.0 },
          { rfqItemId: items[1].id, quotedUnitPriceUsd: 125.0 },
        ],
        validUntilDate: '2026-10-15T00:00:00Z',
      });

      Assert.equal(quoted.status, 'QUOTED');
      Assert.equal(quoted.quoted_total_usd, 50 * 980 + 50 * 125); // 55,250

      // 3. Buyer Acceptance
      const orderConversion = await repo.acceptQuoteAndConvertToOrder(rfq.id);
      Assert.equal(orderConversion.rfqId, rfq.id);
      Assert.isTrue(orderConversion.orderId.startsWith('ord-b2b-'));
      Assert.equal(orderConversion.totalAmountUsd, 55250.0);
    });
  });

  describe('B2BTieredPricingEvaluatorQueryEngine', () => {
    const engine = new B2BTieredPricingEvaluatorQueryEngine(db);

    it('should evaluate volume discount tiers correctly', async () => {
      const evaluation = await engine.evaluateVolumePricing('var-laptop-001', 25, 1200.0);
      Assert.isTrue(!!evaluation);
      Assert.equal(evaluation.orderQuantity, 25);
      Assert.equal(evaluation.baseRetailUnitPriceUsd, 1200.0);
      Assert.isTrue(evaluation.appliedTierDiscountPercent >= 0);
      Assert.isTrue(evaluation.totalOrderPriceUsd > 0);
      Assert.isTrue(evaluation.totalSavingsUsd >= 0);
    });
  });

  describe('B2BDunningAgingReceivablesQueryEngine', () => {
    const engine = new B2BDunningAgingReceivablesQueryEngine(db);

    it('should compute accounts receivable aging buckets and dunning action', async () => {
      const aging = await engine.generateAgingReport('corp_retail_02', '2026-09-30');
      Assert.isTrue(!!aging);
      Assert.equal(aging.companyId, 'corp_retail_02');
      Assert.isTrue(typeof aging.aging.totalOutstandingUsd === 'number');
      Assert.isTrue(typeof aging.recommendedDunningAction === 'string');
      Assert.isTrue(Array.isArray(aging.invoices));
    });
  });

  describe('B2BWholesaleMarginOptimizer', () => {
    it('should analyze margin safety across tiered wholesale structures', () => {
      const tiers = [
        { tierName: 'TIER_SMALL (10-49)', minUnits: 10, discountPercent: 10.0 },
        { tierName: 'TIER_MEDIUM (50-199)', minUnits: 50, discountPercent: 20.0 },
        { tierName: 'TIER_BULK (200+)', minUnits: 200, discountPercent: 35.0 },
      ];

      const analysis = B2BWholesaleMarginOptimizer.analyzeMarginSafety(
        'SKU-LAPTOP-PRO',
        600.0, // Unit Cost
        1000.0, // Retail Price (40% retail margin)
        tiers,
        15.0 // Min allowed margin 15%
      );

      Assert.isTrue(!!analysis);
      Assert.equal(analysis.variantSku, 'SKU-LAPTOP-PRO');
      Assert.equal(analysis.baselineRetailMarginPercent, 40.0);
      Assert.equal(analysis.tierEvaluations.length, 3);

      // Tier 1: 10% off = 900 price -> margin 300 / 900 = 33.33% (Valid)
      Assert.equal(analysis.tierEvaluations[0].isProfitable, true);
      Assert.equal(analysis.tierEvaluations[0].violatesMinMarginThreshold, false);

      // Tier 3: 35% off = 650 price -> margin 50 / 650 = 7.69% (< 15% threshold)
      Assert.equal(analysis.tierEvaluations[2].violatesMinMarginThreshold, true);

      // Optimal recommended tier should be TIER_MEDIUM
      Assert.equal(analysis.optimalVolumeRecommendation.recommendedTierName, 'TIER_MEDIUM (50-199)');
    });
  });

  describe('B2BTaxExemptionValidator', () => {
    it('should validate US EIN and international VAT registration numbers', () => {
      const validUS = B2BTaxExemptionValidator.validateCertificate('US', '12-3456789');
      Assert.equal(validUS.status, 'VALID');

      const validDE = B2BTaxExemptionValidator.validateCertificate('DE', 'DE123456789');
      Assert.equal(validDE.status, 'VALID');

      const invalidDE = B2BTaxExemptionValidator.validateCertificate('DE', 'DE12345'); // Too short
      Assert.equal(invalidDE.status, 'INVALID_FORMAT');

      const expired = B2BTaxExemptionValidator.validateCertificate('US', '12-3456789', '2020-01-01');
      Assert.equal(expired.status, 'EXPIRED');
    });
  });
});
