import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  street: z.string().min(3, 'Street address is required'),
  apartment: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State / Province is required'),
  postalCode: z.string().min(3, 'Postal / ZIP code is required'),
  country: z.string().min(2, 'Country is required').default('United States'),
  isDefaultShipping: z.boolean().optional().default(false),
  isDefaultBilling: z.boolean().optional().default(false),
  isDefault: z.boolean().optional().default(false),
  type: z.enum(['home', 'office', 'work', 'other']).default('home'),
});

export type AddressFormData = z.infer<typeof addressSchema>;
export type AddressFormValues = AddressFormData;

export const creditCardPaymentSchema = z.object({
  cardholderName: z.string().min(2, 'Cardholder name is required'),
  cardNumber: z
    .string()
    .min(13, 'Card number must be 13-19 digits')
    .max(19, 'Card number too long')
    .regex(/^[\d\s-]+$/, 'Card number must contain only digits'),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Month must be 01-12'),
  expiryYear: z.string().regex(/^\d{2}(\d{2})?$/, 'Enter valid 2 or 4 digit year'),
  cvv: z.string().min(3, 'CVV must be 3 or 4 digits').max(4, 'CVV must be 3 or 4 digits').regex(/^\d+$/, 'CVV must be numeric'),
  saveCard: z.boolean().optional().default(false),
});

export type CreditCardFormData = z.infer<typeof creditCardPaymentSchema>;

export const upiPaymentSchema = z.object({
  upiId: z.string().min(3, 'UPI ID is required').regex(/^[\w.-]+@[\w.-]+$/, 'Enter a valid UPI ID (e.g., name@okaxis)'),
});

export type UpiPaymentFormData = z.infer<typeof upiPaymentSchema>;

export const netBankingSchema = z.object({
  bankCode: z.string().min(1, 'Please select your bank'),
});

export type NetBankingFormData = z.infer<typeof netBankingSchema>;

export const orderCheckoutSchema = z.object({
  shippingAddressId: z.string().min(1, 'Shipping address is required'),
  billingAddressId: z.string().min(1, 'Billing address is required'),
  shippingMethodId: z.string().min(1, 'Shipping method is required'),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'upi', 'netbanking', 'cod', 'wallet']),
  orderNotes: z.string().optional(),
});

export type OrderCheckoutFormData = z.infer<typeof orderCheckoutSchema>;
