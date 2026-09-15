import { ISellerService } from '../api/sellerService';
import { mockStorage } from './mockStorage';
import {
  SellerProfile,
  SellerDashboardStats,
  SellerPayout,
  SellerInventoryAlert,
  Order,
  Product,
  ReturnRequest,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export class MockSellerService implements ISellerService {
  async getSellerProfile(sellerId = 'seller-tech-vault'): Promise<ApiResponse<SellerProfile>> {
    await mockStorage.delay(150);
    const sellers = mockStorage.getSellers();
    const seller = sellers.find((s) => s.id === sellerId) || sellers[0];
    return { success: true, data: seller };
  }

  async updateSellerProfile(data: Partial<SellerProfile>): Promise<ApiResponse<SellerProfile>> {
    await mockStorage.delay(300);
    const sellers = mockStorage.getSellers();
    const seller = sellers[0];
    const updated = { ...seller, ...data };
    sellers[0] = updated;
    mockStorage.saveSellers(sellers);
    return { success: true, data: updated, message: 'Store settings updated successfully' };
  }

  async getDashboardStats(): Promise<ApiResponse<SellerDashboardStats>> {
    await mockStorage.delay(200);
    const products = mockStorage.getProducts().filter((p) => p.sellerId === 'seller-tech-vault');
    const orders = mockStorage.getOrders();

    const lowStock = products.filter((p) => p.totalInventory > 0 && p.totalInventory <= 10).length;
    const outOfStock = products.filter((p) => p.totalInventory === 0).length;

    const stats: SellerDashboardStats = {
      todayRevenue: 4890.50,
      todayRevenueChange: 14.2,
      totalRevenue: 489200.00,
      totalOrders: 1420,
      pendingOrdersCount: orders.filter((o) => o.status === 'processing' || o.status === 'payment_confirmed').length,
      averageOrderValue: 245.80,
      conversionRate: 4.6,
      lowStockItemsCount: lowStock,
      outOfStockItemsCount: outOfStock,
      customerRating: 4.9,
      returnRate: 1.2,
    };

    return { success: true, data: stats };
  }

  async getSellerProducts(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Product>> {
    await mockStorage.delay(200);
    let products = mockStorage.getProducts().filter((p) => p.sellerId === 'seller-tech-vault');

    if (status && status !== 'all') {
      products = products.filter((p) => p.status === status);
    }

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

  async getInventoryAlerts(): Promise<ApiResponse<SellerInventoryAlert[]>> {
    await mockStorage.delay(150);
    const products = mockStorage.getProducts().filter((p) => p.sellerId === 'seller-tech-vault');
    const alerts: SellerInventoryAlert[] = [];

    products.forEach((p) => {
      if (p.totalInventory <= 15) {
        alerts.push({
          productId: p.id,
          productTitle: p.title,
          sku: p.sku,
          currentStock: p.totalInventory,
          reorderThreshold: 15,
          status: p.totalInventory === 0 ? 'out_of_stock' : 'low_stock',
        });
      }
    });

    return { success: true, data: alerts };
  }

  async updateStock(productId: string, variantId?: string, quantity = 0, _reorderThreshold = 5): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(250);
    const products = mockStorage.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) {
        variant.inventoryQuantity = quantity;
        variant.stockStatus = quantity > 0 ? (quantity <= 5 ? 'low_stock' : 'in_stock') : 'out_of_stock';
      }
      product.totalInventory = product.variants.reduce((acc, v) => acc + v.inventoryQuantity, 0);
    } else {
      product.totalInventory = quantity;
    }

    product.stockStatus = product.totalInventory > 0 ? (product.totalInventory <= 10 ? 'low_stock' : 'in_stock') : 'out_of_stock';
    product.updatedAt = new Date().toISOString();

    mockStorage.saveProducts(products);
    return { success: true, data: { success: true }, message: 'Stock updated successfully' };
  }

  async getSellerOrders(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Order>> {
    await mockStorage.delay(200);
    let orders = mockStorage.getOrders();

    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }

    const total = orders.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = orders.slice(startIndex, startIndex + limit);

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

  async fulfillOrder(orderId: string, carrier: string, trackingNumber: string): Promise<ApiResponse<Order>> {
    await mockStorage.delay(350);
    const orders = mockStorage.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'shipped';
    order.shippingCarrier = carrier;
    order.shippingTrackingNumber = trackingNumber;
    order.updatedAt = new Date().toISOString();
    order.trackingEvents = order.trackingEvents || [];
    order.trackingEvents.push({
      id: `trk-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'shipped',
      title: `Dispatched with ${carrier}`,
      description: `Package picked up by carrier. Tracking number: ${trackingNumber}`,
      location: 'Seller Warehouse Hub',
      carrierName: carrier,
      trackingNumber,
    });

    mockStorage.saveOrders(orders);
    return { success: true, data: order, message: 'Order marked as shipped' };
  }

  async getReturnRequests(): Promise<ApiResponse<ReturnRequest[]>> {
    await mockStorage.delay(150);
    const orders = mockStorage.getOrders();
    const allReturns: ReturnRequest[] = [];
    orders.forEach((o) => {
      if (o.returnRequests) {
        allReturns.push(...o.returnRequests);
      }
    });
    return { success: true, data: allReturns };
  }

  async resolveReturnRequest(returnId: string, action: 'approve' | 'reject' | 'refund', notes = ''): Promise<ApiResponse<ReturnRequest>> {
    await mockStorage.delay(300);
    const orders = mockStorage.getOrders();
    let targetReturn: ReturnRequest | undefined;

    orders.forEach((o) => {
      if (o.returnRequests) {
        const ret = o.returnRequests.find((r) => r.id === returnId);
        if (ret) {
          ret.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'refunded';
          ret.sellerNotes = notes;
          ret.resolvedAt = new Date().toISOString();
          targetReturn = ret;
          if (action === 'refund') {
            o.status = 'refunded';
          }
        }
      }
    });

    if (!targetReturn) throw new Error('Return request not found');
    mockStorage.saveOrders(orders);

    return {
      success: true,
      data: targetReturn,
      message: `Return request ${action}ed successfully`,
    };
  }

  async getPayouts(): Promise<ApiResponse<SellerPayout[]>> {
    await mockStorage.delay(150);
    const payouts: SellerPayout[] = [
      {
        id: 'pay-1',
        sellerId: 'seller-tech-vault',
        payoutNumber: 'PAY-2024-001',
        periodStart: '2024-02-01T00:00:00Z',
        periodEnd: '2024-02-15T00:00:00Z',
        grossAmount: 42800.00,
        platformFee: 3424.00,
        taxWithheld: 856.00,
        netAmount: 38520.00,
        status: 'paid',
        processedAt: '2024-02-16T10:00:00Z',
        paymentMethod: 'ACH Direct Deposit (**** 4891)',
      },
      {
        id: 'pay-2',
        sellerId: 'seller-tech-vault',
        payoutNumber: 'PAY-2024-002',
        periodStart: '2024-02-16T00:00:00Z',
        periodEnd: '2024-02-28T00:00:00Z',
        grossAmount: 38900.00,
        platformFee: 3112.00,
        taxWithheld: 778.00,
        netAmount: 35010.00,
        status: 'processing',
        paymentMethod: 'ACH Direct Deposit (**** 4891)',
      },
    ];
    return { success: true, data: payouts };
  }

  async requestPayout(amount: number): Promise<ApiResponse<SellerPayout>> {
    await mockStorage.delay(350);
    const newPayout: SellerPayout = {
      id: `pay-${Date.now()}`,
      sellerId: 'seller-tech-vault',
      payoutNumber: `PAY-2024-${Math.floor(100 + Math.random() * 900)}`,
      periodStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString(),
      grossAmount: amount,
      platformFee: Number((amount * 0.08).toFixed(2)),
      taxWithheld: Number((amount * 0.02).toFixed(2)),
      netAmount: Number((amount * 0.90).toFixed(2)),
      status: 'pending',
      paymentMethod: 'ACH Direct Deposit (**** 4891)',
    };
    return { success: true, data: newPayout, message: 'Payout request initiated successfully' };
  }
}

export const mockSellerService = new MockSellerService();
