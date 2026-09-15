import { IPaymentService, ProcessPaymentParams } from '../api/paymentService';
import { mockStorage } from './mockStorage';
import { PaymentDetails, ApiResponse } from '../../types';

export class MockPaymentService implements IPaymentService {
  async processPayment(params: ProcessPaymentParams): Promise<ApiResponse<PaymentDetails>> {
    await mockStorage.delay(800); // realistic payment latency

    if (params.simulateFailure) {
      throw new Error('Payment declined by card issuer: Insufficient funds or invalid security code.');
    }

    const transactionId = `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now()}`;

    let details: PaymentDetails;

    if (params.method === 'credit_card' || params.method === 'debit_card') {
      const cardNum = params.cardDetails?.cardNumber.replace(/\s+/g, '') || '4242';
      const lastFour = cardNum.slice(-4);
      const isVisa = cardNum.startsWith('4');
      const isMastercard = cardNum.startsWith('5');
      const isAmex = cardNum.startsWith('3');

      const cardBrand = isVisa ? 'Visa' : isMastercard ? 'MasterCard' : isAmex ? 'Amex' : 'Card';

      details = {
        method: params.method,
        transactionId,
        status: 'completed',
        paidAt: new Date().toISOString(),
        cardLastFour: lastFour,
        cardBrand,
        amount: params.amount,
      };
    } else if (params.method === 'upi') {
      details = {
        method: 'upi',
        transactionId,
        status: 'completed',
        paidAt: new Date().toISOString(),
        upiId: params.upiId || 'customer@okaxis',
        amount: params.amount,
      };
    } else if (params.method === 'netbanking') {
      details = {
        method: 'netbanking',
        transactionId,
        status: 'completed',
        paidAt: new Date().toISOString(),
        bankName: params.bankCode || 'HDFC Bank',
        amount: params.amount,
      };
    } else if (params.method === 'cod') {
      details = {
        method: 'cod',
        transactionId: `COD-${Date.now()}`,
        status: 'pending',
        amount: params.amount,
      };
    } else {
      // wallet
      details = {
        method: 'wallet',
        transactionId,
        status: 'completed',
        paidAt: new Date().toISOString(),
        amount: params.amount,
      };
    }

    return {
      success: true,
      data: details,
      message: params.method === 'cod' ? 'Order confirmed for Cash on Delivery' : 'Payment processed successfully',
    };
  }

  async verify3DSecure(transactionId: string, otp: string): Promise<ApiResponse<PaymentDetails>> {
    await mockStorage.delay(500);
    if (otp !== '123456' && otp !== '000000') {
      throw new Error('Invalid One-Time Password (OTP). Please try again or use 123456.');
    }

    return {
      success: true,
      data: {
        method: 'credit_card',
        transactionId,
        status: 'completed',
        paidAt: new Date().toISOString(),
        cardLastFour: '4242',
        cardBrand: 'Visa',
        amount: 150.00,
      },
      message: '3D Secure authentication verified successfully',
    };
  }

  async getSavedPaymentMethods(): Promise<ApiResponse<any[]>> {
    await mockStorage.delay(100);
    return {
      success: true,
      data: [
        {
          id: 'pm-1',
          type: 'card',
          brand: 'Visa',
          lastFour: '4242',
          expiryMonth: '09',
          expiryYear: '28',
          cardholderName: 'Alex Morgan',
          isDefault: true,
        },
        {
          id: 'pm-2',
          type: 'card',
          brand: 'MasterCard',
          lastFour: '8891',
          expiryMonth: '11',
          expiryYear: '27',
          cardholderName: 'Alex Morgan',
          isDefault: false,
        },
        {
          id: 'pm-3',
          type: 'upi',
          upiId: 'alex.morgan@okaxis',
          isDefault: false,
        },
      ],
    };
  }

  async refundPayment(transactionId: string, amount: number, reason: string): Promise<ApiResponse<PaymentDetails>> {
    await mockStorage.delay(400);
    return {
      success: true,
      data: {
        method: 'credit_card',
        transactionId: `REFUND-${transactionId}`,
        status: 'refunded',
        paidAt: new Date().toISOString(),
        amount,
      },
      message: `Refund of $${amount} processed: ${reason}`,
    };
  }
}

export const mockPaymentService = new MockPaymentService();
