import { z } from 'zod';

export const productVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  title: z.string().min(1, 'Variant title is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  originalPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  inventoryQuantity: z.number().int().min(0, 'Inventory quantity cannot be negative'),
  attributes: z.record(z.string()),
  barcode: z.string().optional(),
  imageUrl: z.string().optional(),
  weightKg: z.number().min(0).optional(),
});

export const productAttributeOptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Option name is required'),
  value: z.string().min(1, 'Option value is required'),
  imageExtraUrl: z.string().optional(),
});

export const productAttributeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Attribute name is required'),
  type: z.enum(['color', 'size', 'select', 'text']),
  options: z.array(productAttributeOptionSchema).min(1, 'At least one option is required'),
});

export const productSpecificationSchema = z.object({
  group: z.string().min(1, 'Group name is required'),
  key: z.string().min(1, 'Specification name is required'),
  value: z.string().min(1, 'Specification value is required'),
});

export const productFormSchema = z.object({
  title: z.string().min(3, 'Product title must be at least 3 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters'),
  description: z.string().min(20, 'Full description must be at least 20 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  subCategoryId: z.string().optional(),
  brandId: z.string().min(1, 'Please select a brand'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  originalPrice: z.number().min(0).optional(),
  sku: z.string().min(2, 'SKU is required'),
  totalInventory: z.number().int().min(0, 'Inventory cannot be negative'),
  tags: z.array(z.string()).default([]),
  images: z.array(z.object({
    id: z.string(),
    url: z.string().url('Invalid image URL'),
    altText: z.string(),
    isPrimary: z.boolean(),
    order: z.number(),
  })).min(1, 'At least one product image is required'),
  attributes: z.array(productAttributeSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  specifications: z.array(productSpecificationSchema).default([]),
  returnPolicyDays: z.number().int().min(0).default(30),
  warrantyInfo: z.string().optional(),
  shippingWeightKg: z.number().min(0).default(0.5),
  status: z.enum(['draft', 'pending_approval', 'active', 'rejected', 'archived']).default('draft'),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
