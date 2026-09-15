import { z } from 'zod';
import { addressSchema } from './checkoutSchemas';

export const sellerOnboardingSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  storeSlug: z.string().min(3, 'Store slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  tagline: z.string().min(5, 'Tagline is required'),
  description: z.string().min(20, 'Please provide a store description (at least 20 characters)'),
  email: z.string().email('Valid business email is required'),
  phone: z.string().min(7, 'Valid business phone is required'),
  businessRegistrationNumber: z.string().min(3, 'Business registration number is required'),
  taxIdentificationNumber: z.string().min(3, 'Tax ID is required'),
  address: addressSchema,
  bankDetails: z.object({
    accountHolder: z.string().min(2, 'Account holder name is required'),
    bankName: z.string().min(2, 'Bank name is required'),
    accountNumber: z.string().min(5, 'Account number is required'),
    routingNumber: z.string().min(5, 'Routing/IFSC/Swift number is required'),
    accountType: z.enum(['checking', 'savings']),
  }),
  policies: z.object({
    shippingPolicy: z.string().min(10, 'Shipping policy description is required'),
    returnPolicy: z.string().min(10, 'Return policy description is required'),
    warrantyPolicy: z.string().min(10, 'Warranty policy description is required'),
  }),
});

export type SellerOnboardingFormData = z.infer<typeof sellerOnboardingSchema>;

export const sellerInventoryUpdateSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  reorderThreshold: z.number().int().min(0).optional(),
});

export type SellerInventoryUpdateData = z.infer<typeof sellerInventoryUpdateSchema>;
