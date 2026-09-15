export interface B2BCompanyAccountTable {
  id: string; // UUID
  company_name: string;
  registration_number: string; // Tax/Company Reg
  credit_limit_usd: number;
  available_credit_usd: number;
  payment_terms: 'PREPAID' | 'NET_15' | 'NET_30' | 'NET_60' | 'NET_90';
  account_status: 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'CREDIT_HOLD';
  tax_exemption_certificate_id?: string;
  is_tax_exempt: boolean;
  primary_contact_email: string;
  created_at: string;
  updated_at: string;
}

export interface B2BTieredPricingMatrixTable {
  id: string; // UUID
  variant_id: string;
  min_quantity: number; // e.g. 10, 50, 100, 500
  max_quantity?: number; // e.g. 49, 99, 499, null (for 500+)
  discount_percentage: number; // e.g. 15.00
  fixed_unit_price_usd?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface B2BQuoteRFQTable {
  id: string; // UUID
  rfq_number: string; // e.g. 'RFQ-2026-9001'
  company_id: string;
  seller_id: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED_TO_ORDER';
  requested_total_usd: number;
  quoted_total_usd?: number;
  converted_order_id?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface B2BQuoteRFQItemTable {
  id: string; // UUID
  rfq_id: string;
  variant_id: string;
  sku: string;
  quantity_requested: number;
  target_unit_price_usd: number;
  quoted_unit_price_usd?: number;
  notes?: string;
  created_at: string;
}

export interface B2BCorporateInvoiceTable {
  id: string; // UUID
  invoice_number: string; // e.g. 'INV-CORP-2026-0042'
  company_id: string;
  order_id: string;
  invoice_amount_usd: number;
  paid_amount_usd: number;
  due_date: string;
  payment_status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'WRITTEN_OFF';
  dunning_stage: number; // 0 = Current, 1 = First notice, 2 = Warning, 3 = Collections
  issued_at: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}
