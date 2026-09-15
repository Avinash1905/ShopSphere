import { IProductService } from '../api/productService';
import { mockStorage } from './mockStorage';
import {
  Product,
  ProductFilterParams,
  PaginatedResponse,
  Category,
  Brand,
  ApiResponse,
} from '../../types';

export class MockProductService implements IProductService {
  async getProducts(params: ProductFilterParams = {}): Promise<PaginatedResponse<Product>> {
    await mockStorage.delay(250);
    let list = mockStorage.getProducts();

    // Query filter
    if (params.query) {
      const q = params.query.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.brand?.name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (params.categoryId) {
      list = list.filter(
        (p) => p.category?.id === params.categoryId || p.category?.slug === params.categoryId
      );
    }

    // Subcategory filter
    if (params.subCategoryId) {
      list = list.filter(
        (p) => p.subCategory?.id === params.subCategoryId || p.subCategory?.slug === params.subCategoryId
      );
    }

    // Brand filter
    if (params.brandIds && params.brandIds.length > 0) {
      list = list.filter((p) => params.brandIds!.includes(p.brand?.id));
    }

    // Price range
    if (params.minPrice !== undefined) {
      list = list.filter((p) => p.price >= params.minPrice!);
    }
    if (params.maxPrice !== undefined) {
      list = list.filter((p) => p.price <= params.maxPrice!);
    }

    // Min Rating
    if (params.minRating !== undefined) {
      list = list.filter((p) => p.rating >= params.minRating!);
    }

    // Stock status
    if (params.stockStatus && params.stockStatus.length > 0) {
      list = list.filter((p) => params.stockStatus!.includes(p.stockStatus));
    }

    // Seller ID filter
    if (params.sellerId) {
      list = list.filter((p) => p.sellerId === params.sellerId);
    }

    // Status filter
    if (params.status) {
      list = list.filter((p) => p.status === params.status);
    }

    // Sorting
    const sortBy = params.sortBy || 'featured';
    if (sortBy === 'price_low_high') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high_low') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      list.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // featured
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    const page = params.page || 1;
    const limit = params.limit || 12;
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = list.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    await mockStorage.delay(200);
    const products = mockStorage.getProducts();
    const product = products.find((p) => p.slug === slug);
    if (!product) throw new Error('Product not found');
    return { success: true, data: product };
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    await mockStorage.delay(150);
    const products = mockStorage.getProducts();
    const product = products.find((p) => p.id === id);
    if (!product) throw new Error('Product not found');
    return { success: true, data: product };
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    await mockStorage.delay(150);
    return { success: true, data: mockStorage.getCategories() };
  }

  async getBrands(): Promise<ApiResponse<Brand[]>> {
    await mockStorage.delay(150);
    return { success: true, data: mockStorage.getBrands() };
  }

  async getFeaturedProducts(limit = 8): Promise<ApiResponse<Product[]>> {
    await mockStorage.delay(200);
    const products = mockStorage.getProducts().filter((p) => p.featured && p.status === 'active');
    return { success: true, data: products.slice(0, limit) };
  }

  async getTrendingProducts(limit = 8): Promise<ApiResponse<Product[]>> {
    await mockStorage.delay(200);
    const products = mockStorage.getProducts().filter((p) => p.isTrending && p.status === 'active');
    return { success: true, data: products.slice(0, limit) };
  }

  async getDealsOfTheDay(limit = 4): Promise<ApiResponse<Product[]>> {
    await mockStorage.delay(200);
    const products = mockStorage.getProducts().filter((p) => p.isDealOfTheDay && p.status === 'active');
    return { success: true, data: products.slice(0, limit) };
  }

  async getRelatedProducts(productId: string, limit = 4): Promise<ApiResponse<Product[]>> {
    await mockStorage.delay(200);
    const products = mockStorage.getProducts();
    const current = products.find((p) => p.id === productId);
    if (!current) return { success: true, data: [] };

    const related = products.filter(
      (p) => p.id !== productId && p.category?.id === current.category?.id && p.status === 'active'
    );
    return { success: true, data: related.slice(0, limit) };
  }

  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    await mockStorage.delay(400);
    const products = mockStorage.getProducts();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sellerId: data.sellerId || 'seller-tech-vault',
      sellerName: data.sellerName || 'TechVault Official',
      title: data.title || 'Untitled Product',
      slug: data.slug || `product-${Date.now()}`,
      shortDescription: data.shortDescription || '',
      description: data.description || '',
      brand: data.brand || { id: 'brand-other', name: 'Generic', slug: 'generic' },
      category: data.category || { id: 'cat-other', name: 'General', slug: 'general' },
      tags: data.tags || [],
      price: data.price || 0,
      originalPrice: data.originalPrice,
      currency: 'USD',
      status: data.status || 'draft',
      stockStatus: data.totalInventory && data.totalInventory > 0 ? 'in_stock' : 'out_of_stock',
      totalInventory: data.totalInventory || 0,
      sku: data.sku || `SKU-${Date.now()}`,
      images: data.images || [],
      attributes: data.attributes || [],
      variants: data.variants || [],
      specifications: data.specifications || [],
      rating: 5.0,
      reviewCount: 0,
      returnPolicyDays: 30,
      shippingWeightKg: 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.unshift(newProduct);
    mockStorage.saveProducts(products);
    return { success: true, data: newProduct, message: 'Product created successfully' };
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    await mockStorage.delay(350);
    const products = mockStorage.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const updated: Product = {
      ...products[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    products[idx] = updated;
    mockStorage.saveProducts(products);
    return { success: true, data: updated, message: 'Product updated successfully' };
  }

  async deleteProduct(id: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(300);
    const products = mockStorage.getProducts().filter((p) => p.id !== id);
    mockStorage.saveProducts(products);
    return { success: true, data: { success: true }, message: 'Product deleted' };
  }
}

export const mockProductService = new MockProductService();
