import { z } from 'zod';

export const userModerationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  action: z.enum(['activate', 'suspend', 'ban']),
  reason: z.string().min(5, 'Please provide a moderation reason'),
});

export type UserModerationFormData = z.infer<typeof userModerationSchema>;

export const sellerApprovalSchema = z.object({
  sellerId: z.string().min(1, 'Seller ID is required'),
  action: z.enum(['approve', 'reject', 'suspend']),
  commissionRate: z.number().min(0).max(50).optional(),
  feedbackNotes: z.string().min(5, 'Feedback notes are required'),
});

export type SellerApprovalFormData = z.infer<typeof sellerApprovalSchema>;

export const platformSettingsSchema = z.object({
  siteName: z.string().min(2, 'Site name is required'),
  siteUrl: z.string().url('Must be a valid URL'),
  supportEmail: z.string().email('Must be a valid email'),
  supportPhone: z.string().min(7, 'Phone number is required'),
  defaultCurrency: z.string().min(3).max(3),
  taxRatePercentage: z.number().min(0).max(100),
  standardShippingFee: z.number().min(0),
  freeShippingThreshold: z.number().min(0),
  defaultCommissionRate: z.number().min(0).max(50),
  maintenanceMode: z.boolean(),
  allowGuestCheckout: z.boolean(),
  enableUserRegistration: z.boolean(),
  enableSellerRegistration: z.boolean(),
  maxUploadSizeMb: z.number().min(1).max(50),
  refundWindowDays: z.number().int().min(1).max(180),
  autoApproveSellerProducts: z.boolean(),
});

export type PlatformSettingsFormData = z.infer<typeof platformSettingsSchema>;
