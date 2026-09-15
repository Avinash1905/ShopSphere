import { httpClient } from './httpClient';
import { PaymentDetails, PaymentMethodType, ApiResponse } from '../../types';

export interface ProcessPaymentParams {
  amount: number;
  method: PaymentMethodType;
  cardDetails?: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  upiId?: string;
  bankCode?: string;
  simulateFailure?: boolean;
}

export interface IPaymentService {
  processPayment(params: ProcessPaymentParams): Promise<ApiResponse<PaymentDetails>>;
  verify3DSecure(transactionId: string, otp: string): Promise<ApiResponse<PaymentDetails>>;
  getSavedPaymentMethods(): Promise<ApiResponse<any[]>>;
  refundPayment(transactionId: string, amount: number, reason: string): Promise<ApiResponse<PaymentDetails>>;
}

export class ApiPaymentService implements IPaymentService {
  async processPayment(params: ProcessPaymentParams): Promise<ApiResponse<PaymentDetails>> {
    return httpClient.post<PaymentDetails>('/payments/process', params);
  }

  async verify3DSecure(transactionId: string, otp: string): Promise<ApiResponse<PaymentDetails>> {
    return httpClient.post<PaymentDetails>('/payments/3ds-verify', { transactionId, otp });
  }

  async getSavedPaymentMethods(): Promise<ApiResponse<any[]>> {
    return httpClient.get<any[]>('/payments/saved-methods');
  }

  async refundPayment(transactionId: string, amount: number, reason: string): Promise<ApiResponse<PaymentDetails>> {
    return httpClient.post<PaymentDetails>('/payments/refund', { transactionId, amount, reason });
  }
}

export const apiPaymentService = new ApiPaymentService();
