import { describe, it, expect } from 'vitest';
import { productRepository } from '../database/repositories/ProductRepository';
import { categoryRepository } from '../database/repositories/CategoryRepository';

describe('Product and Catalog Domain Tests', () => {
  it('should find products by category and handle pagination', async () => {
    const electronics = await productRepository.findMany({ categoryId: 'cat-1' }, 1, 10);
    expect(electronics.items).toBeDefined();
    expect(Array.isArray(electronics.items)).toBe(true);
    expect(electronics.total).toBeGreaterThanOrEqual(0);
    expect(electronics.totalPages).toBeGreaterThanOrEqual(0);
  });

  it('should retrieve or create a valid product by its unique identifier', async () => {
    const created = await productRepository.create({
      id: 'test-product-sku-1',
      title: 'Test Ergonomic Mechanical Keyboard',
      slug: 'test-ergonomic-mechanical-keyboard',
      description: 'RGB mechanical keyboard with hot-swappable switches.',
      basePrice: 129.99,
      stockQuantity: 25,
      rating: 4.8,
      reviewCount: 42,
      categoryId: 'cat-1',
      categoryName: 'Electronics',
      sellerId: 'seller-tech-vault',
      sellerName: 'TechVault Official',
      status: 'published'
    });
    expect(created.id).toBe('test-product-sku-1');

    const retrieved = await productRepository.findById('test-product-sku-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.basePrice).toBe(129.99);
    expect(retrieved?.status).toBe('published');
  });

  it('should retrieve categories list correctly via findMany', async () => {
    const categories = await categoryRepository.findMany();
    expect(categories.items).toBeDefined();
    expect(Array.isArray(categories.items)).toBe(true);
  });
});
