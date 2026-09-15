import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const B2BWholesaleSeeder: Seeder = {
  name: 'B2BWholesaleSeeder',
  order: 18,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    let count = 0;
    const now = new Date().toISOString();

    // 1. Seed B2B Company Accounts
    const companies = [
      {
        id: 'corp_tech_01',
        name: 'Apex Global Enterprises Inc.',
        reg: 'US-EIN-12-3456789',
        limit: 250000.0,
        avail: 215000.0,
        terms: 'NET_30',
        status: 'ACTIVE',
        taxCert: 'TAX-EXEMPT-CA-99881',
        isExempt: true,
        email: 'procurement@apexglobal.example.com',
      },
      {
        id: 'corp_retail_02',
        name: 'Summit Regional Retailers LLC',
        reg: 'US-EIN-98-7654321',
        limit: 100000.0,
        avail: 85000.0,
        terms: 'NET_60',
        status: 'ACTIVE',
        taxCert: undefined,
        isExempt: false,
        email: 'ap@summitretail.example.com',
      },
    ];

    for (const c of companies) {
      await db.execute(
        `INSERT INTO b2b_company_accounts (
          id, company_name, registration_number, credit_limit_usd,
          available_credit_usd, payment_terms, account_status,
          tax_exemption_certificate_id, is_tax_exempt, primary_contact_email,
          created_at, updated_at
        ) VALUES ('${c.id}', '${c.name}', '${c.reg}', ${c.limit}, ${c.avail}, '${c.terms}', '${c.status}', ${c.taxCert ? `'${c.taxCert}'` : 'NULL'}, ${c.isExempt ? 'TRUE' : 'FALSE'}, '${c.email}', '${now}', '${now}')`
      );
      count++;
    }

    // 2. Seed Tiered Pricing Matrix
    const tiers = [
      { id: 'tier_01', varId: 'var-laptop-001', min: 10, max: 49, discount: 10.0, fixed: 1080.0 },
      { id: 'tier_02', varId: 'var-laptop-001', min: 50, max: 199, discount: 18.0, fixed: 984.0 },
      { id: 'tier_03', varId: 'var-laptop-001', min: 200, max: null, discount: 25.0, fixed: 900.0 },
      { id: 'tier_04', varId: 'var-phone-001', min: 20, max: 99, discount: 12.0, fixed: 704.0 },
      { id: 'tier_05', varId: 'var-phone-001', min: 100, max: null, discount: 20.0, fixed: 640.0 },
    ];

    for (const t of tiers) {
      await db.execute(
        `INSERT INTO b2b_tiered_pricing_matrix (
          id, variant_id, min_quantity, max_quantity, discount_percentage,
          fixed_unit_price_usd, is_active, created_at, updated_at
        ) VALUES ('${t.id}', '${t.varId}', ${t.min}, ${t.max !== null ? t.max : 'NULL'}, ${t.discount}, ${t.fixed}, TRUE, '${now}', '${now}')`
      );
      count++;
    }

    // 3. Seed Corporate Invoices
    const invoices = [
      {
        id: 'inv_001',
        num: 'INV-CORP-2026-0001',
        companyId: 'corp_tech_01',
        orderId: 'ord_b2b_901',
        amount: 35000.0,
        paid: 0.0,
        due: '2026-10-15',
        status: 'UNPAID',
        stage: 0,
        issued: '2026-09-15',
      },
      {
        id: 'inv_002',
        num: 'INV-CORP-2026-0002',
        companyId: 'corp_retail_02',
        orderId: 'ord_b2b_902',
        amount: 15000.0,
        paid: 0.0,
        due: '2026-08-01',
        status: 'OVERDUE',
        stage: 2,
        issued: '2026-06-01',
      },
    ];

    for (const inv of invoices) {
      await db.execute(
        `INSERT INTO b2b_corporate_invoices (
          id, invoice_number, company_id, order_id, invoice_amount_usd,
          paid_amount_usd, due_date, payment_status, dunning_stage,
          issued_at, created_at, updated_at
        ) VALUES ('${inv.id}', '${inv.num}', '${inv.companyId}', '${inv.orderId}', ${inv.amount}, ${inv.paid}, '${inv.due}', '${inv.status}', ${inv.stage}, '${inv.issued}T00:00:00Z', '${now}', '${now}')`
      );
      count++;
    }

    return { count, entityName: 'b2b_wholesale_and_tiered_pricing' };
  },
};
