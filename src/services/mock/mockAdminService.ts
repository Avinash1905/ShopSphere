import { IAdminService } from '../api/adminService';
import { mockStorage } from './mockStorage';
import {
  PlatformStats,
  AuditLog,
  PlatformSettings,
  User,
  SellerProfile,
  Product,
  ProductReview,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export class MockAdminService implements IAdminService {
  async getPlatformStats(): Promise<ApiResponse<PlatformStats>> {
    await mockStorage.delay(200);
    const stats: PlatformStats = {
      grossMerchandiseValue: 2490500.00,
      gmvGrowthPercentage: 24.8,
      totalPlatformRevenue: 211692.50,
      revenueGrowthPercentage: 21.4,
      totalOrders: 14980,
      ordersGrowthPercentage: 18.2,
      totalCustomers: 21400,
      customerGrowthPercentage: 27.5,
      totalActiveSellers: 410,
      pendingSellerApprovals: 8,
      totalListedProducts: 3420,
      pendingProductApprovals: 14,
      disputedOrdersCount: 5,
      averageCustomerRating: 4.8,
    };
    return { success: true, data: stats };
  }

  async getUsers(page = 1, limit = 10, role?: string, status?: string): Promise<PaginatedResponse<User>> {
    await mockStorage.delay(200);
    let users = mockStorage.getUsers();

    if (role && role !== 'all') {
      users = users.filter((u) => u.role === role);
    }
    if (status && status !== 'all') {
      users = users.filter((u) => u.status === status);
    }

    const total = users.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = users.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data,
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

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned', reason: string): Promise<ApiResponse<User>> {
    await mockStorage.delay(300);
    const users = mockStorage.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    user.status = status;
    user.updatedAt = new Date().toISOString();
    mockStorage.saveUsers(users);

    const logs = mockStorage.getAuditLogs();
    logs.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'user-admin-1',
      actorName: 'Victoria Sterling',
      actorRole: 'admin',
      actorEmail: 'admin@shopsphere.com',
      action: `USER_${status.toUpperCase()}`,
      resourceType: 'user',
      resourceId: user.id,
      details: `Status set to ${status}. Reason: ${reason}`,
      ipAddress: '192.0.2.14',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
    mockStorage.saveAuditLogs(logs);

    return { success: true, data: user, message: `User status changed to ${status}` };
  }

  async getSellers(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<SellerProfile>> {
    await mockStorage.delay(200);
    let sellers = mockStorage.getSellers();

    if (status && status !== 'all') {
      sellers = sellers.filter((s) => s.status === status);
    }

    const total = sellers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = sellers.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data,
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

  async moderateSeller(sellerId: string, action: 'approve' | 'reject' | 'suspend', commissionRate?: number, notes = ''): Promise<ApiResponse<SellerProfile>> {
    await mockStorage.delay(350);
    const sellers = mockStorage.getSellers();
    const seller = sellers.find((s) => s.id === sellerId);
    if (!seller) throw new Error('Seller not found');

    seller.status = action === 'approve' ? 'active' : action === 'reject' ? 'rejected' : 'suspended';
    if (commissionRate !== undefined) seller.commissionRate = commissionRate;

    mockStorage.saveSellers(sellers);

    const logs = mockStorage.getAuditLogs();
    logs.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'user-admin-1',
      actorName: 'Victoria Sterling',
      actorRole: 'admin',
      actorEmail: 'admin@shopsphere.com',
      action: `SELLER_${action.toUpperCase()}`,
      resourceType: 'seller',
      resourceId: seller.id,
      details: `Action: ${action}. Notes: ${notes}`,
      ipAddress: '192.0.2.14',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
    mockStorage.saveAuditLogs(logs);

    return { success: true, data: seller, message: `Seller ${action}ed successfully` };
  }

  async getPendingProducts(page = 1, limit = 10): Promise<PaginatedResponse<Product>> {
    await mockStorage.delay(200);
    const products = mockStorage.getProducts().filter((p) => p.status === 'pending_approval' || p.status === 'draft');
    const total = products.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = products.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data,
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

  async moderateProduct(productId: string, action: 'approve' | 'reject', feedback = ''): Promise<ApiResponse<Product>> {
    await mockStorage.delay(300);
    const products = mockStorage.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    product.status = action === 'approve' ? 'active' : 'rejected';
    product.updatedAt = new Date().toISOString();
    mockStorage.saveProducts(products);

    const logs = mockStorage.getAuditLogs();
    logs.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'user-admin-1',
      actorName: 'Victoria Sterling',
      actorRole: 'admin',
      actorEmail: 'admin@shopsphere.com',
      action: `PRODUCT_${action.toUpperCase()}`,
      resourceType: 'product',
      resourceId: product.id,
      details: `Product ${product.title} ${action}ed. Feedback: ${feedback}`,
      ipAddress: '192.0.2.14',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
    mockStorage.saveAuditLogs(logs);

    return { success: true, data: product, message: `Product ${action}ed successfully` };
  }

  async getFlaggedReviews(page = 1, limit = 10): Promise<PaginatedResponse<ProductReview>> {
    await mockStorage.delay(150);
    const reviews = mockStorage.getReviews().filter((r) => r.status === 'flagged' || r.status === 'pending_moderation');
    const total = reviews.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = reviews.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data,
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

  async moderateReview(reviewId: string, action: 'publish' | 'hide' | 'delete'): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(200);
    let reviews = mockStorage.getReviews();
    if (action === 'delete') {
      reviews = reviews.filter((r) => r.id !== reviewId);
    } else {
      const rev = reviews.find((r) => r.id === reviewId);
      if (rev) {
        rev.status = action === 'publish' ? 'published' : 'hidden';
      }
    }
    mockStorage.saveReviews(reviews);
    return { success: true, data: { success: true } };
  }

  async getAuditLogs(page = 1, limit = 15): Promise<PaginatedResponse<AuditLog>> {
    await mockStorage.delay(150);
    const logs = mockStorage.getAuditLogs();
    const total = logs.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = logs.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data,
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

  async getPlatformSettings(): Promise<ApiResponse<PlatformSettings>> {
    await mockStorage.delay(100);
    return { success: true, data: mockStorage.getSettings() };
  }

  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<ApiResponse<PlatformSettings>> {
    await mockStorage.delay(300);
    const current = mockStorage.getSettings();
    const updated = { ...current, ...settings };
    mockStorage.saveSettings(updated);
    return { success: true, data: updated, message: 'Platform settings updated successfully' };
  }
}

export const mockAdminService = new MockAdminService();
