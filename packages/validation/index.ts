/**
 * ShopSphere Shared Validation Package
 * Centralized Zod validation schemas for all domain entities, requests, and API payloads.
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false)
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'seller']).default('customer'),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number required'),
  addressLine1: z.string().min(5, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'Valid postal code is required'),
  country: z.string().default('United States'),
  type: z.enum(['home', 'office', 'work', 'other']).default('home'),
  isDefault: z.boolean().optional().default(false)
});

export const productListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  basePrice: z.number().positive('Base price must be greater than 0'),
  originalPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().nonnegative('Stock cannot be negative'),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  images: z.array(z.string().url('Must be valid image URL')).min(1, 'At least 1 image is required'),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'pending_approval', 'published', 'archived']).default('pending_approval')
});

export const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  title: z.string().min(3, 'Review title must be at least 3 characters').max(100),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000),
  images: z.array(z.string().url()).optional().default([])
});

export const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().min(5),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().positive('Discount value must be positive'),
  minOrderAmount: z.number().nonnegative().default(0),
  maxDiscountAmount: z.number().positive().optional(),
  startDate: z.string(),
  endDate: z.string(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true)
});

export const paymentSubmissionSchema = z.object({
  orderId: z.string().min(1),
  method: z.enum(['credit_card', 'debit_card', 'upi', 'netbanking', 'cod', 'wallet']),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  expiry: z.string().optional(),
  cvv: z.string().optional(),
  upiId: z.string().optional(),
  bankCode: z.string().optional()
});
