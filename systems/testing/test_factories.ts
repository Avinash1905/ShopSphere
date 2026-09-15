import { UserEntity } from '../../database/schema/user.schema.js';
import { SellerEntity } from '../../database/schema/seller.schema.js';
import { ProductEntity } from '../../database/schema/product.schema.js';
import { ProductVariantEntity, InventoryEntity } from '../../database/schema/variant_inventory.schema.js';
import { OrderEntity, OrderItemEntity } from '../../database/schema/order.schema.js';
import { PaymentEntity } from '../../database/schema/payment.schema.js';
import { CouponEntity } from '../../database/schema/coupon.schema.js';
import { ReviewEntity } from '../../database/schema/review.schema.js';

export class UserFactory {
  public static create(overrides: Partial<UserEntity> = {}): UserEntity {
    const id = overrides.id || `usr-test-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    return {
      id,
      email: overrides.email || `test.${id}@example.com`,
      password_hash: overrides.password_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      salt: overrides.salt || 'testsalt123',
      first_name: overrides.first_name || 'Test',
      last_name: overrides.last_name || 'User',
      status: overrides.status || 'ACTIVE',
      email_verified: overrides.email_verified !== undefined ? overrides.email_verified : true,
      phone_verified: overrides.phone_verified !== undefined ? overrides.phone_verified : false,
      two_factor_enabled: overrides.two_factor_enabled || false,
      failed_login_attempts: overrides.failed_login_attempts || 0,
      created_at: overrides.created_at || new Date().toISOString(),
      updated_at: overrides.updated_at || new Date().toISOString(),
      ...overrides,
    };
  }
}

export class SellerFactory {
  public static create(overrides: Partial<SellerEntity> = {}): SellerEntity {
    const id = overrides.id || `seller-test-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    return {
      id,
      user_id: overrides.user_id || `usr-seller-${id}`,
      store_name: overrides.store_name || 'Test Apex Store',
      store_slug: overrides.store_slug || `test-store-${id}`,
      business_name: overrides.business_name || 'Apex Enterprises Inc',
      verification_status: overrides.verification_status || 'VERIFIED',
      commission_rate_percentage: overrides.commission_rate_percentage || 8.5,
      rating_average: overrides.rating_average || 4.8,
      total_reviews_count: overrides.total_reviews_count || 150,
      total_sales_count: overrides.total_sales_count || 500,
      total_revenue_amount: overrides.total_revenue_amount || 75000.0,
      support_email: overrides.support_email || 'support@apexstore.test',
      is_featured: overrides.is_featured || false,
      created_at: overrides.created_at || new Date().toISOString(),
      updated_at: overrides.updated_at || new Date().toISOString(),
      ...overrides,
    };
  }
}

export class ProductFactory {
  public static create(overrides: Partial<ProductEntity> = {}): ProductEntity {
    const id = overrides.id || `prod-test-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    return {
      id,
      seller_id: overrides.seller_id || 'seller-apple',
      category_id: overrides.category_id || 'cat-electronics',
      brand_id: overrides.brand_id || 'brand-apple',
      title: overrides.title || 'Pro Wireless Headphones',
      slug: overrides.slug || `pro-wireless-headphones-${id}`,
      description: overrides.description || 'High-fidelity audio headphones with dynamic bass response.',
      status: overrides.status || 'PUBLISHED',
      tags: overrides.tags || ['audio', 'wireless', 'bluetooth'],
      attributes: overrides.attributes || { color: 'Black', bluetooth_version: '5.3' },
      image_urls: overrides.image_urls || ['https://cdn.shopsphere.io/p1.jpg'],
      base_price: overrides.base_price || 199.99,
      rating_average: overrides.rating_average || 4.75,
      reviews_count: overrides.reviews_count || 45,
      total_sales_count: overrides.total_sales_count || 320,
      is_featured: overrides.is_featured || false,
      created_at: overrides.created_at || new Date().toISOString(),
      updated_at: overrides.updated_at || new Date().toISOString(),
      ...overrides,
    };
  }
}

export class OrderFactory {
  public static create(overrides: Partial<OrderEntity> = {}): OrderEntity {
    const rand = Math.floor(Math.random() * 10000000);
    const id = overrides.id || `ord-test-${Date.now()}-${rand}`;
    return {
      id,
      order_number: overrides.order_number || `ORD-TEST-${Date.now()}-${rand}`,
      user_id: overrides.user_id || 'usr-cust-01',
      seller_id: overrides.seller_id || 'seller-apple',
      order_status: overrides.order_status || 'CONFIRMED',
      payment_status: overrides.payment_status || 'PAID',
      shipping_status: overrides.shipping_status || 'FULFILLED',
      currency: overrides.currency || 'USD',
      subtotal_amount: overrides.subtotal_amount || 199.99,
      discount_amount: overrides.discount_amount || 0.0,
      tax_amount: overrides.tax_amount || 16.0,
      shipping_fee: overrides.shipping_fee || 0.0,
      grand_total: overrides.grand_total || 215.99,
      shipping_address_id: overrides.shipping_address_id || 'addr-01',
      billing_address_id: overrides.billing_address_id || 'addr-01',
      created_at: overrides.created_at || new Date().toISOString(),
      updated_at: overrides.updated_at || new Date().toISOString(),
      ...overrides,
    };
  }
}

export class CouponFactory {
  public static create(overrides: Partial<CouponEntity> = {}): CouponEntity {
    const id = overrides.id || `cpn-test-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    return {
      id,
      code: overrides.code || 'PROMO10',
      title: overrides.title || '$10 Promotional Voucher',
      discount_type: overrides.discount_type || 'FIXED_AMOUNT',
      discount_value: overrides.discount_value || 10.0,
      min_order_amount: overrides.min_order_amount || 50.0,
      usage_limit_per_user: overrides.usage_limit_per_user || 1,
      times_used: overrides.times_used || 0,
      start_date: overrides.start_date || new Date().toISOString(),
      end_date: overrides.end_date || new Date(Date.now() + 30 * 86400000).toISOString(),
      is_active: overrides.is_active !== undefined ? overrides.is_active : true,
      applicable_category_ids: overrides.applicable_category_ids || [],
      applicable_product_ids: overrides.applicable_product_ids || [],
      applicable_seller_ids: overrides.applicable_seller_ids || [],
      created_at: overrides.created_at || new Date().toISOString(),
      updated_at: overrides.updated_at || new Date().toISOString(),
      ...overrides,
    };
  }
}
