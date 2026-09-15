import { create } from 'zustand';
import {
  SellerProfile,
  SellerDashboardStats,
  Product,
  SellerInventoryAlert,
  Order,
  OrderStatus,
  ReturnRequest,
  SellerPayout,
} from '../types';
import { sellerService } from '../services';

interface SellerState {
  profile: SellerProfile | null;
  currentSeller: SellerProfile | null;
  stats: SellerDashboardStats | null;
  dashboardMetrics: SellerDashboardStats | null;
  products: Product[];
  totalProducts: number;
  inventoryAlerts: SellerInventoryAlert[];
  orders: Order[];
  totalOrders: number;
  returnRequests: ReturnRequest[];
  payouts: SellerPayout[];
  isLoading: boolean;
  error: string | null;

  fetchSellerOverview: () => Promise<void>;
  fetchDashboardMetrics: () => Promise<void>;
  fetchSellerProducts: (page?: number, status?: string) => Promise<void>;
  fetchSellerOrders: (page?: number, status?: string) => Promise<void>;
  fetchInventoryAlerts: () => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductStock: (productId: string, quantity: number) => Promise<void>;
  updateStock: (productId: string, variantId?: string, quantity?: number, threshold?: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  fulfillOrder: (orderId: string, carrier: string, trackingNumber: string) => Promise<void>;
  resolveReturn: (returnId: string, action: 'approve' | 'reject' | 'refund', notes?: string) => Promise<void>;
  fetchPayouts: () => Promise<void>;
  requestPayout: (amount: number) => Promise<void>;
  updateProfile: (data: Partial<SellerProfile>) => Promise<void>;
}

export const useSellerStore = create<SellerState>((set, get) => ({
  profile: null,
  currentSeller: null,
  stats: null,
  dashboardMetrics: null,
  products: [],
  totalProducts: 0,
  inventoryAlerts: [],
  orders: [],
  totalOrders: 0,
  returnRequests: [],
  payouts: [],
  isLoading: false,
  error: null,

  fetchSellerOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const [profileRes, statsRes] = await Promise.all([
        sellerService.getSellerProfile(),
        sellerService.getDashboardStats(),
      ]);
      set({
        profile: profileRes.data,
        currentSeller: profileRes.data,
        stats: statsRes.data,
        dashboardMetrics: statsRes.data,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchDashboardMetrics: async () => {
    await get().fetchSellerOverview();
  },

  fetchSellerProducts: async (page = 1, status) => {
    set({ isLoading: true });
    try {
      const res = await sellerService.getSellerProducts(page, 50, status);
      const mapped = res.data.map((p) => ({
        ...p,
        name: p.name || p.title,
        stock: p.stock ?? p.totalInventory ?? 50,
      }));
      set({
        products: mapped,
        totalProducts: res.pagination.total,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchSellerOrders: async (page = 1, status) => {
    set({ isLoading: true });
    try {
      const res = await sellerService.getSellerOrders(page, 50, status);
      set({
        orders: res.data,
        totalOrders: res.pagination.total,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchInventoryAlerts: async () => {
    try {
      const res = await sellerService.getInventoryAlerts();
      set({ inventoryAlerts: res.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createProduct: async (data) => {
    set({ isLoading: true });
    try {
      const newProd: Product = {
        id: `prod_${Date.now()}`,
        sellerId: get().profile?.id || 'sel_1',
        sellerName: get().profile?.storeName || 'Aura Sound Technologies Ltd.',
        title: data.name || data.title || 'Untitled Product',
        name: data.name || data.title || 'Untitled Product',
        slug: (data.name || data.title || 'untitled').toLowerCase().replace(/\s+/g, '-'),
        shortDescription: data.description?.slice(0, 100) || '',
        description: data.description || '',
        brand: data.brand || { id: 'b_1', name: 'Aura', slug: 'aura' },
        category: data.category || { id: 'c_1', name: 'Electronics', slug: 'electronics' },
        tags: data.tags || [],
        price: data.price || 99.99,
        originalPrice: data.compareAtPrice,
        compareAtPrice: data.compareAtPrice,
        status: data.status || 'pending',
        stockStatus: 'in_stock',
        totalInventory: data.stock || 50,
        stock: data.stock || 50,
        sku: data.sku || `SKU-${Date.now()}`,
        images: data.images || [],
        attributes: [],
        variants: data.variants || [],
        specifications: data.specifications || {},
        rating: 5.0,
        reviewCount: 0,
        returnPolicyDays: 30,
        shippingWeightKg: 0.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({ products: [newProd, ...get().products], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateProduct: async (id, data) => {
    set({
      products: get().products.map((p) => (p.id === id ? { ...p, ...data } : p)),
    });
  },

  deleteProduct: async (id) => {
    set({
      products: get().products.filter((p) => p.id !== id),
    });
  },

  updateProductStock: async (productId, quantity) => {
    set({
      products: get().products.map((p) =>
        p.id === productId ? { ...p, stock: quantity, totalInventory: quantity } : p
      ),
    });
  },

  updateStock: async (productId, variantId, quantity, threshold) => {
    try {
      await sellerService.updateStock(productId, variantId, quantity, threshold);
      await get().fetchSellerProducts();
      await get().fetchInventoryAlerts();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({
      orders: get().orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    });
  },

  fulfillOrder: async (orderId, carrier, trackingNumber) => {
    set({ isLoading: true });
    try {
      await sellerService.fulfillOrder(orderId, carrier, trackingNumber);
      await get().fetchSellerOrders();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  resolveReturn: async (returnId, action, notes) => {
    try {
      await sellerService.resolveReturnRequest(returnId, action, notes);
      const res = await sellerService.getReturnRequests();
      set({ returnRequests: res.data });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchPayouts: async () => {
    try {
      const res = await sellerService.getPayouts();
      set({ payouts: res.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  requestPayout: async (amount) => {
    set({ isLoading: true });
    try {
      await sellerService.requestPayout(amount);
      await get().fetchPayouts();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await sellerService.updateSellerProfile(data);
      set({ profile: res.data, currentSeller: res.data });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },
}));
