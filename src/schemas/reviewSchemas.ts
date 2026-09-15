import { z } from 'zod';

export const reviewFormSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1, 'Please select a star rating').max(5, 'Rating cannot exceed 5'),
  title: z.string().min(3, 'Review headline must be at least 3 characters'),
  comment: z.string().min(10, 'Review comment must be at least 10 characters'),
  images: z.array(z.string().url()).default([]),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;

export const sellerReplySchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  content: z.string().min(5, 'Reply content must be at least 5 characters'),
});

export type SellerReplyFormData = z.infer<typeof sellerReplySchema>;
