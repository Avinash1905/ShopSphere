import { z } from 'zod';

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Code must be at least 3 characters')
      .max(20, 'Code must not exceed 20 characters')
      .regex(/^[A-Z0-9_-]+$/, 'Code must contain uppercase letters, numbers, hyphens, or underscores only'),
    title: z.string().min(3, 'Title is required'),
    description: z.string().min(5, 'Description is required'),
    discountType: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
    discountValue: z.number().min(0.01, 'Discount value must be greater than 0'),
    minimumOrderAmount: z.number().min(0).default(0),
    maximumDiscountAmount: z.number().min(0).optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    usageLimitPerUser: z.number().int().min(1).default(1),
    totalUsageLimit: z.number().int().min(1).default(100),
    isGlobal: z.boolean().default(true),
    applicableCategoryIds: z.array(z.string()).optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type CouponFormData = z.infer<typeof couponFormSchema>;
