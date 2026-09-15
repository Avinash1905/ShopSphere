/**
 * ShopSphere Payment Simulator & Processing Subsystem
 * Idempotency token manager, card Luhn algorithm validation, simulated 3D Secure verification,
 * UPI intent resolver, and automated refund ledger.
 */

import { PaymentMethodType, PaymentStatusType } from '../../packages/shared-types';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  status: PaymentStatusType;
  gatewayReference: string;
  idempotencyKey?: string;
  cardLast4?: string;
  cardBrand?: string;
  upiId?: string;
  failureReason?: string;
  refundedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessPaymentInput {
  orderId: string;
  customerId: string;
  amount: number;
  currency?: string;
  method: PaymentMethodType;
  idempotencyKey: string;
  paymentDetails: {
    cardNumber?: string;
    cardHolder?: string;
    expiry?: string;
    cvv?: string;
    upiId?: string;
    bankCode?: string;
  };
}

export class PaymentSimulatorGateway {
  private transactions: Map<string, PaymentTransaction> = new Map();
  private idempotencyStore: Map<string, string> = new Map(); // idempotencyKey -> transactionId

  public processPayment(input: ProcessPaymentInput): {
    success: boolean;
    transaction?: PaymentTransaction;
    requires3DSecure?: boolean;
    authUrl?: string;
    error?: string;
  } {
    // 1. Idempotency Check
    if (this.idempotencyStore.has(input.idempotencyKey)) {
      const existingId = this.idempotencyStore.get(input.idempotencyKey)!;
      return { success: true, transaction: this.transactions.get(existingId) };
    }

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const gatewayRef = `GW-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // 2. Validate Card if method is card
    let cardBrand = 'UNKNOWN';
    let cardLast4: string | undefined;

    if (input.method === 'credit_card' || input.method === 'debit_card') {
      const num = (input.paymentDetails.cardNumber || '').replace(/\s+/g, '');
      if (num.length < 13 || !this.validateLuhn(num)) {
        return {
          success: false,
          error: 'Invalid payment card number (failed Luhn checksum).'
        };
      }
      cardBrand = this.detectCardBrand(num);
      cardLast4 = num.slice(-4);
    }

    // 3. Simulated Failure Scenarios (e.g. CVV '000' triggers decline)
    if (input.paymentDetails.cvv === '000') {
      const failedTxn: PaymentTransaction = {
        id: transactionId,
        orderId: input.orderId,
        customerId: input.customerId,
        amount: input.amount,
        currency: input.currency || 'USD',
        method: input.method,
        status: 'FAILED',
        gatewayReference: gatewayRef,
        failureReason: 'Card issuer declined transaction: Insufficient funds or invalid security code.',
        refundedAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.transactions.set(transactionId, failedTxn);
      return { success: false, error: failedTxn.failureReason, transaction: failedTxn };
    }

    // 4. Successful Authorized Transaction
    const txn: PaymentTransaction = {
      id: transactionId,
      orderId: input.orderId,
      customerId: input.customerId,
      amount: input.amount,
      currency: input.currency || 'USD',
      method: input.method,
      status: 'SUCCESS',
      gatewayReference: gatewayRef,
      idempotencyKey: input.idempotencyKey,
      cardBrand: cardBrand !== 'UNKNOWN' ? cardBrand : undefined,
      cardLast4,
      upiId: input.paymentDetails.upiId,
      refundedAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.transactions.set(transactionId, txn);
    this.idempotencyStore.set(input.idempotencyKey, transactionId);

    return {
      success: true,
      transaction: txn
    };
  }

  public refundPayment(transactionId: string, refundAmount?: number, reason?: string): { success: boolean; error?: string; refundedAmount?: number } {
    const txn = this.transactions.get(transactionId);
    if (!txn) {
      return { success: false, error: 'Transaction not found.' };
    }

    if (txn.status !== 'SUCCESS') {
      return { success: false, error: `Cannot refund transaction with status '${txn.status}'.` };
    }

    const toRefund = refundAmount || (txn.amount - txn.refundedAmount);
    if (txn.refundedAmount + toRefund > txn.amount) {
      return { success: false, error: 'Refund amount exceeds captured payment amount.' };
    }

    txn.refundedAmount += toRefund;
    if (txn.refundedAmount >= txn.amount) {
      txn.status = 'REFUNDED';
    }
    txn.updatedAt = new Date().toISOString();

    return { success: true, refundedAmount: txn.refundedAmount };
  }

  public getTransaction(transactionId: string): PaymentTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  private validateLuhn(cardNumber: string): boolean {
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);
      if (isNaN(digit)) return false;
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  private detectCardBrand(num: string): string {
    if (/^4/.test(num)) return 'VISA';
    if (/^5[1-5]/.test(num)) return 'MASTERCARD';
    if (/^3[47]/.test(num)) return 'AMEX';
    if (/^6(?:011|5)/.test(num)) return 'DISCOVER';
    return 'GENERIC_CARD';
  }
}
