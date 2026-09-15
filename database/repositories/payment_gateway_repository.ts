/**
 * ShopSphere Database Repositories - Payment Gateway Transactions, Refunds, Tokenized Methods & Disputes
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  transaction_type: 'AUTHORIZE' | 'CAPTURE' | 'VOID' | 'REFUND' | 'VERIFY_ONLY';
  amount: number;
  currency: string;
  gateway_transaction_id?: string;
  gateway_response_code?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  raw_response?: any;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: 'CARD' | 'UPI' | 'PAYPAL' | 'NET_BANKING' | 'CRYPTO';
  provider_token: string;
  card_brand?: string;
  last4?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
}

export interface PaymentRefund {
  id: string;
  payment_id: string;
  order_id: string;
  refund_amount: number;
  currency: string;
  reason: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'CANCELLED';
  gateway_refund_id?: string;
  processed_at?: string;
  created_at: string;
}

export interface PaymentDispute {
  id: string;
  payment_id: string;
  gateway_dispute_id?: string;
  dispute_amount: number;
  currency: string;
  dispute_reason: string;
  status: 'NEEDS_RESPONSE' | 'UNDER_REVIEW' | 'WON' | 'LOST' | 'CLOSED';
  evidence_due_date?: string;
  evidence_data?: any;
  created_at: string;
  resolved_at?: string;
}

export class PaymentGatewayRepository extends BaseRepository<PaymentTransaction> {
  constructor(db: MigrationDatabaseAdapter) {
    super('payment_transactions', db);
  }

  public async recordTransaction(trans: Omit<PaymentTransaction, 'id' | 'created_at'> & { id?: string }): Promise<PaymentTransaction> {
    const id = trans.id || `ptxn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    return this.create({
      id,
      ...trans,
      created_at: now,
    });
  }

  public async savePaymentMethod(method: Omit<PaymentMethod, 'id' | 'created_at'> & { id?: string }): Promise<PaymentMethod> {
    const id = method.id || `pmeth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    if (method.is_default) {
      await this.db.execute(`UPDATE payment_methods SET is_default = 0 WHERE user_id = ?`, [method.user_id]);
    }

    const clean = this.unmapEntity({
      id,
      ...method,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO payment_methods (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );

    const rows = await this.db.query<PaymentMethod>('SELECT * FROM payment_methods WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as PaymentMethod;
  }

  public async createRefund(refund: Omit<PaymentRefund, 'id' | 'status' | 'created_at'> & { id?: string }): Promise<PaymentRefund> {
    const id = refund.id || `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      ...refund,
      status: 'PENDING',
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO payment_refunds (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<PaymentRefund>('SELECT * FROM payment_refunds WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as PaymentRefund;
  }

  public async processRefund(refundId: string, gatewayRefundId: string): Promise<PaymentRefund> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE payment_refunds SET status = 'PROCESSED', gateway_refund_id = ?, processed_at = ? WHERE id = ?`,
      [gatewayRefundId, now, refundId]
    );
    const rows = await this.db.query<PaymentRefund>('SELECT * FROM payment_refunds WHERE id = ?', [refundId]);
    return this.mapRow(rows[0]) as unknown as PaymentRefund;
  }

  public async openDispute(dispute: Omit<PaymentDispute, 'id' | 'status' | 'created_at'> & { id?: string }): Promise<PaymentDispute> {
    const id = dispute.id || `disp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      ...dispute,
      status: 'NEEDS_RESPONSE',
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO payment_disputes (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<PaymentDispute>('SELECT * FROM payment_disputes WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as PaymentDispute;
  }
}
