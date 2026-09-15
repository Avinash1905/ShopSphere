import { z } from 'zod';

export const returnRequestSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  orderItemId: z.string().min(1, 'Please select an item to return'),
  reason: z.enum(['defective', 'wrong_item', 'not_as_described', 'size_fit', 'changed_mind', 'arrived_late'], {
    errorMap: () => ({ message: 'Please select a valid reason' }),
  }),
  detailedReason: z.string().min(15, 'Please provide details about the issue (minimum 15 characters)'),
  refundMethod: z.enum(['original_payment', 'wallet_credit']),
  photos: z.array(z.string().url()).optional().default([]),
});

export type ReturnRequestFormData = z.infer<typeof returnRequestSchema>;

export const returnModerationSchema = z.object({
  returnRequestId: z.string().min(1, 'Return Request ID is required'),
  action: z.enum(['approve', 'reject', 'issue_refund']),
  sellerNotes: z.string().min(5, 'Notes are required for moderation actions'),
});

export type ReturnModerationFormData = z.infer<typeof returnModerationSchema>;
