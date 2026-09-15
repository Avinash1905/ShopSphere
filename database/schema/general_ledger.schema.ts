export interface GLChartOfAccountTable {
  id: string; // UUID
  account_code: string; // e.g. '1010-CASH', '2010-AP', '4010-REVENUE'
  account_name: string;
  account_category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  account_subtype: string; // e.g. 'CURRENT_ASSET', 'ACCOUNTS_RECEIVABLE', 'SALES_TAX_PAYABLE'
  normal_balance: 'DEBIT' | 'CREDIT';
  currency_code: string; // 'USD', 'EUR', etc.
  is_active: boolean;
  parent_account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GLFiscalPeriodTable {
  id: string; // UUID
  fiscal_year: number; // e.g. 2026
  period_number: number; // 1 to 12
  period_name: string; // 'Jan 2026'
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  is_closed: boolean;
  closed_at?: string;
  closed_by_user_id?: string;
  cryptographic_seal_hash?: string; // Anti-tamper audit hash
  created_at: string;
}

export interface GLJournalEntryTable {
  id: string; // UUID
  entry_number: string; // e.g. 'JE-2026-09-0001'
  fiscal_period_id: string;
  posting_date: string;
  document_type: 'ORDER_FULFILLMENT' | 'PAYOUT_DISBURSEMENT' | 'REFUND_SETTLEMENT' | 'SELLER_FEE' | 'FX_REVALUATION' | 'MANUAL_ADJUSTMENT';
  reference_id?: string; // e.g. order_id or payout_id
  memo: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  total_debit: number;
  total_credit: number;
  created_by_user_id: string;
  approved_by_user_id?: string;
  reversal_entry_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GLJournalEntryLineTable {
  id: string; // UUID
  journal_entry_id: string;
  account_id: string;
  account_code: string;
  line_number: number;
  debit_amount: number;
  credit_amount: number;
  memo?: string;
  foreign_currency_code?: string;
  foreign_amount?: number;
  fx_exchange_rate?: number;
  created_at: string;
}

export interface GLAccountBalanceTable {
  id: string; // UUID
  account_id: string;
  fiscal_period_id: string;
  beginning_balance: number;
  total_debit: number;
  total_credit: number;
  ending_balance: number;
  updated_at: string;
}

export interface SellerTaxForm1099KTable {
  id: string; // UUID
  seller_id: string;
  tax_year: number;
  gross_payment_amount_usd: number;
  transaction_count: number;
  monthly_breakdown_json: string; // JSON with month 1-12 gross
  ein_tin_last4: string;
  legal_business_name: string;
  is_w9_verified: boolean;
  filing_status: 'PENDING_GENERATION' | 'GENERATED' | 'DELIVERED_TO_SELLER' | 'SUBMITTED_TO_IRS';
  generated_at?: string;
  created_at: string;
  updated_at: string;
}
