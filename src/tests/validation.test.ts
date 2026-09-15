import { describe, it, expect } from 'vitest';
import { addressSchema, creditCardPaymentSchema, upiPaymentSchema } from '../schemas/checkoutSchemas';
import { loginSchema, registerSchema } from '../schemas/authSchemas';
import { productFormSchema } from '../schemas/productSchemas';

describe('Zod Validation Schemas', () => {
  describe('Address Schema', () => {
    it('validates a valid shipping address object', () => {
      const validAddress = {
        fullName: 'Alex Morgan',
        phone: '+1 (555) 234-5678',
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'Oregon',
        postalCode: '97477',
        country: 'United States',
        type: 'home',
      };

      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('rejects an address missing required fields like city or street', () => {
      const invalidAddress = {
        fullName: 'A',
        phone: '123',
      };

      const result = addressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });
  });

  describe('Payment Schemas', () => {
    it('validates 16-digit card number and valid expiry', () => {
      const validCard = {
        cardholderName: 'Alex Morgan',
        cardNumber: '4242 4242 4242 4242',
        expiryMonth: '12',
        expiryYear: '28',
        cvv: '123',
      };

      const result = creditCardPaymentSchema.safeParse(validCard);
      expect(result.success).toBe(true);
    });

    it('rejects invalid UPI virtual payment address', () => {
      const invalidUpi = { upiId: 'not-an-email-or-upi-handle' };
      const result = upiPaymentSchema.safeParse(invalidUpi);
      expect(result.success).toBe(false);
    });

    it('accepts valid UPI virtual payment address', () => {
      const validUpi = { upiId: 'alex.morgan@okaxis' };
      const result = upiPaymentSchema.safeParse(validUpi);
      expect(result.success).toBe(true);
    });
  });

  describe('Auth Schemas', () => {
    it('validates standard email and password login payload', () => {
      const payload = {
        email: 'customer@shopsphere.com',
        password: 'Password123!',
      };

      const result = loginSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects registration without password match or accepted terms', () => {
      const invalidReg = {
        fullName: 'Alex',
        email: 'alex@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword456!',
        acceptTerms: false,
      };

      const result = registerSchema.safeParse(invalidReg);
      expect(result.success).toBe(false);
    });
  });

  describe('Product Creation Schema', () => {
    it('validates required fields for marketplace product listings', () => {
      const validProduct = {
        title: 'Aura Studio Wireless Headphones',
        shortDescription: 'Active noise cancellation headphones with high fidelity audio.',
        description: 'Premium acoustic headphones with active noise cancellation and 40 hour battery life.',
        categoryId: 'cat_electronics',
        brandId: 'brand_aura',
        price: 299.99,
        sku: 'AURA-NC-001',
        totalInventory: 50,
        images: [
          {
            id: 'img-1',
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
            altText: 'Headphones',
            isPrimary: true,
            order: 1,
          },
        ],
      };

      const result = productFormSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });
  });
});
