import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const GeneralLedgerSeeder: Seeder = {
  name: 'GeneralLedgerSeeder',
  order: 17,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    let count = 0;
    const now = new Date().toISOString();

    // 1. Chart of Accounts
    const accounts = [
      { id: 'coa_1010', code: '1010-CASH', name: 'Operating Cash & Escrow', cat: 'ASSET', sub: 'CASH', norm: 'DEBIT' },
      { id: 'coa_1200', code: '1200-AR', name: 'Accounts Receivable (Processor Clearing)', cat: 'ASSET', sub: 'AR', norm: 'DEBIT' },
      { id: 'coa_1300', code: '1300-INV', name: 'Merchandise Inventory Asset', cat: 'ASSET', sub: 'INVENTORY', norm: 'DEBIT' },
      { id: 'coa_2010', code: '2010-AP', name: 'Accounts Payable & Vendor Accruals', cat: 'LIABILITY', sub: 'AP', norm: 'CREDIT' },
      { id: 'coa_2200', code: '2200-TAX', name: 'Sales Tax & VAT Collected Payable', cat: 'LIABILITY', sub: 'TAX_PAYABLE', norm: 'CREDIT' },
      { id: 'coa_2300', code: '2300-SELLER', name: 'Seller Marketplace Payouts Escrow', cat: 'LIABILITY', sub: 'SELLER_ESCROW', norm: 'CREDIT' },
      { id: 'coa_3010', code: '3010-EQUITY', name: 'Contributed Capital & Retained Earnings', cat: 'EQUITY', sub: 'EQUITY', norm: 'CREDIT' },
      { id: 'coa_4010', code: '4010-REV', name: 'Marketplace Platform Commission Revenue', cat: 'REVENUE', sub: 'COMMISSION_REVENUE', norm: 'CREDIT' },
      { id: 'coa_4020', code: '4020-SHIP', name: 'Logistics & Handling Fee Revenue', cat: 'REVENUE', sub: 'LOGISTICS_REVENUE', norm: 'CREDIT' },
      { id: 'coa_5010', code: '5010-GATEWAY', name: 'Payment Processor & Interchange Fees', cat: 'EXPENSE', sub: 'COGS', norm: 'DEBIT' },
      { id: 'coa_5020', code: '5020-INFRA', name: 'Cloud Infrastructure & SaaS Hosting', cat: 'EXPENSE', sub: 'OPEX', norm: 'DEBIT' },
    ];

    for (const a of accounts) {
      await db.execute(
        `INSERT INTO gl_chart_of_accounts (
          id, account_code, account_name, account_category, account_subtype,
          normal_balance, currency_code, is_active, created_at, updated_at
        ) VALUES ('${a.id}', '${a.code}', '${a.name}', '${a.cat}', '${a.sub}', '${a.norm}', 'USD', TRUE, '${now}', '${now}')`
      );
      count++;
    }

    // 2. Fiscal Periods (2026-01 to 2026-12)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let p = 1; p <= 12; p++) {
      const pStr = p < 10 ? `0${p}` : `${p}`;
      const periodId = `period_2026_${pStr}`;
      const startDate = `2026-${pStr}-01`;
      const lastDay = new Date(2026, p, 0).getDate();
      const endDate = `2026-${pStr}-${lastDay < 10 ? '0' + lastDay : lastDay}`;
      const isClosed = p < 9; // Jan-Aug closed

      await db.execute(
        `INSERT INTO gl_fiscal_periods (
          id, fiscal_year, period_number, period_name, start_date,
          end_date, is_closed, closed_at, created_at
        ) VALUES ('${periodId}', 2026, ${p}, '${monthNames[p - 1]} 2026', '${startDate}', '${endDate}', ${isClosed ? 'TRUE' : 'FALSE'}, ${isClosed ? `'${endDate}T23:59:59Z'` : 'NULL'}, '${now}')`
      );
      count++;
    }

    // 3. Sample balanced Journal Entries
    const entries = [
      {
        id: 'je_init_001',
        num: 'JE-202609-0001',
        period: 'period_2026_09',
        date: '2026-09-01',
        type: 'ORDER_FULFILLMENT',
        memo: 'Order #ORD-2026-8801 Customer Payment Settlement',
        debit: 1500.0,
        credit: 1500.0,
        lines: [
          { id: 'line_je1_1', accId: 'coa_1010', code: '1010-CASH', num: 1, d: 1500.0, c: 0, memo: 'Cash received from Stripe' },
          { id: 'line_je1_2', accId: 'coa_2300', code: '2300-SELLER', num: 2, d: 0, c: 1275.0, memo: 'Seller escrow payable (85%)' },
          { id: 'line_je1_3', accId: 'coa_4010', code: '4010-REV', num: 3, d: 0, c: 150.0, memo: 'Platform 10% take-rate' },
          { id: 'line_je1_4', accId: 'coa_2200', code: '2200-TAX', num: 4, d: 0, c: 75.0, memo: 'Sales tax collected 5%' },
        ],
      },
      {
        id: 'je_init_002',
        num: 'JE-202609-0002',
        period: 'period_2026_09',
        date: '2026-09-05',
        type: 'PAYOUT_DISBURSEMENT',
        memo: 'Automated ACH Payout to Top Sellers Batch #901',
        debit: 1275.0,
        credit: 1275.0,
        lines: [
          { id: 'line_je2_1', accId: 'coa_2300', code: '2300-SELLER', num: 1, d: 1275.0, c: 0, memo: 'Clearing seller payable' },
          { id: 'line_je2_2', accId: 'coa_1010', code: '1010-CASH', num: 2, d: 0, c: 1275.0, memo: 'ACH Wire outflow' },
        ],
      },
    ];

    for (const e of entries) {
      await db.execute(
        `INSERT INTO gl_journal_entries (
          id, entry_number, fiscal_period_id, posting_date, document_type,
          memo, status, total_debit, total_credit, created_by_user_id,
          created_at, updated_at
        ) VALUES ('${e.id}', '${e.num}', '${e.period}', '${e.date}', '${e.type}', '${e.memo}', 'POSTED', ${e.debit}, ${e.credit}, 'user_admin_01', '${now}', '${now}')`
      );
      count++;

      for (const l of e.lines) {
        await db.execute(
          `INSERT INTO gl_journal_entry_lines (
            id, journal_entry_id, account_id, account_code, line_number,
            debit_amount, credit_amount, memo, created_at
          ) VALUES ('${l.id}', '${e.id}', '${l.accId}', '${l.code}', ${l.num}, ${l.d}, ${l.c}, '${l.memo}', '${now}')`
        );
        count++;
      }
    }

    return { count, entityName: 'general_ledger_and_fiscal_periods' };
  },
};
