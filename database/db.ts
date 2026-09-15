/**
 * ShopSphere Central Database Engine & Seed Initializer
 * Automatically hydrates repositories with users, products, categories, sellers, coupons, and orders.
 */

import { productRepository } from './repositories/ProductRepository';
import { userRepository } from './repositories/UserRepository';
import { categoryRepository } from './repositories/CategoryRepository';
import { sellerRepository } from './repositories/SellerRepository';
import { couponRepository } from './repositories/CouponRepository';
import { orderRepository } from './repositories/OrderRepository';

export async function initializeDatabase(): Promise<void> {
  console.log('🗄️ Initializing ShopSphere Database and Seeding Core Records...');

  // 1. Seed Users
  await userRepository.create({
    id: 'usr-customer-1',
    email: 'customer@shopsphere.io',
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'customer',
    status: 'active',
    twoFactorEnabled: false
  });

  await userRepository.create({
    id: 'usr-seller-1',
    email: 'seller@techvault.com',
    firstName: 'Marcus',
    lastName: 'Vance',
    role: 'seller',
    status: 'active',
    twoFactorEnabled: true
  });

  await userRepository.create({
    id: 'usr-admin-1',
    email: 'admin@shopsphere.io',
    firstName: 'Elena',
    lastName: 'Rostova',
    role: 'super_admin',
    status: 'active',
    twoFactorEnabled: true
  });

  // 2. Seed Categories
  const categories = [
    { id: 'cat-1', name: 'Electronics', slug: 'electronics', iconName: 'Laptop', isActive: true },
    { id: 'cat-2', name: 'Fashion & Apparel', slug: 'fashion', iconName: 'Shirt', isActive: true },
    { id: 'cat-3', name: 'Home & Kitchen', slug: 'home-kitchen', iconName: 'Home', isActive: true },
    { id: 'cat-4', name: 'Beauty & Personal Care', slug: 'beauty', iconName: 'Sparkles', isActive: true },
    { id: 'cat-5', name: 'Sports & Fitness', slug: 'sports', iconName: 'Dumbbell', isActive: true },
    { id: 'cat-6', name: 'Gaming & VR', slug: 'gaming', iconName: 'Gamepad2', isActive: true }
  ];

  for (const cat of categories) {
    await categoryRepository.create(cat);
  }

  // 3. Seed Sellers
  await sellerRepository.create({
    id: 'seller-tech-vault',
    storeName: 'TechVault Official',
    storeSlug: 'techvault',
    rating: 4.9,
    totalSales: 1250,
    kycStatus: 'verified',
    commissionRate: 0.10
  });

  await sellerRepository.create({
    id: 'seller-urban-threads',
    storeName: 'UrbanThreads Studio',
    storeSlug: 'urban-threads',
    rating: 4.8,
    totalSales: 940,
    kycStatus: 'verified',
    commissionRate: 0.12
  });

  // 4. Seed Flagship Products
  const seedProducts = [
    {
      id: 'prod-iphone-15-pro',
      title: 'Apple iPhone 15 Pro Max - Titanium',
      slug: 'apple-iphone-15-pro-max-titanium',
      description: 'Aerospace-grade titanium design with A17 Pro chip and customizable Action button.',
      basePrice: 1199.00,
      originalPrice: 1299.00,
      stockQuantity: 48,
      rating: 4.9,
      reviewCount: 234,
      categoryId: 'cat-1',
      categoryName: 'Electronics',
      sellerId: 'seller-tech-vault',
      sellerName: 'TechVault Official',
      status: 'published',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'prod-sony-wh1000xm5',
      title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
      slug: 'sony-wh-1000xm5-wireless-headphones',
      description: 'Industry-leading noise cancellation with two processors and 8 microphones.',
      basePrice: 399.99,
      originalPrice: 449.99,
      stockQuantity: 85,
      rating: 4.8,
      reviewCount: 412,
      categoryId: 'cat-1',
      categoryName: 'Electronics',
      sellerId: 'seller-tech-vault',
      sellerName: 'TechVault Official',
      status: 'published',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'prod-nike-air-max',
      title: 'Nike Air Max 270 React - Triple Black',
      slug: 'nike-air-max-270-react-triple-black',
      description: 'Lightweight, layered materials create a modern aesthetic that feels as good as it looks.',
      basePrice: 160.00,
      originalPrice: 180.00,
      stockQuantity: 62,
      rating: 4.7,
      reviewCount: 189,
      categoryId: 'cat-2',
      categoryName: 'Fashion & Apparel',
      sellerId: 'seller-urban-threads',
      sellerName: 'UrbanThreads Studio',
      status: 'published',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'prod-ps5-digital',
      title: 'Sony PlayStation 5 Digital Edition Slim',
      slug: 'sony-playstation-5-digital-edition-slim',
      description: 'Experience lightning-fast loading with an ultra-high speed SSD and deeper immersion.',
      basePrice: 449.99,
      originalPrice: 499.99,
      stockQuantity: 28,
      rating: 4.9,
      reviewCount: 560,
      categoryId: 'cat-6',
      categoryName: 'Gaming & VR',
      sellerId: 'seller-tech-vault',
      sellerName: 'TechVault Official',
      status: 'published',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80'
    }
  ];

  for (const prod of seedProducts) {
    await productRepository.create(prod);
  }

  // 5. Seed Coupons
  await couponRepository.create({
    id: 'cpn-welcome20',
    code: 'WELCOME20',
    description: '20% off on your first order',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 50,
    maxDiscountAmount: 50,
    isActive: true,
    usedCount: 12
  });

  await couponRepository.create({
    id: 'cpn-save50',
    code: 'SAVE50',
    description: '$50 flat discount on orders over $300',
    discountType: 'fixed_amount',
    discountValue: 50,
    minOrderAmount: 300,
    isActive: true,
    usedCount: 5
  });

  console.log('✅ Database initialization and seeding completed successfully.');
}
