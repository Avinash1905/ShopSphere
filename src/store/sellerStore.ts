import { create } from 'zustand';
import {
  SellerProfile,
  SellerDashboardStats,
  Product,
  SellerInventoryAlert,
  Order,
  ReturnRequest,
  SellerPayout,
} from '../types';
import { sellerService } from '../services';

interface SellerState {
  profile: SellerProfile | null;
  stats: SellerDashboardStats | null;
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
  fetchSellerProducts: (page?: number, status?: string) => Promise<void>;
  fetchSellerOrders: (page?: number, status?: string) => Promise<void>;
  fetchInventoryAlerts: () => Promise<void>;
  updateStock: (productId: string, variantId?: string, quantity?: number, threshold?: number) => Promise<void>;
  fulfillOrder: (orderId: string, carrier: string, trackingNumber: string) => Promise<void>;
  resolveReturn: (returnId: string, action: 'approve' | 'reject' | 'refund', notes?: string) => Promise<void>;
  fetchPayouts: () => Promise<void>;
  requestPayout: (amount: number) => Promise<void>;
  updateProfile: (data: Partial<SellerProfile>) => Promise<void>;
}

export const useSellerStore = create<SellerState>((set, get) => ({
  profile: null,
  stats: null,
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
      set({ profile: profileRes.data, stats: statsRes.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchSellerProducts: async (page = 1, status) => {
    set({ isLoading: true });
    try {
      const res = await sellerService.getSellerProducts(page, 10, status);
      set({
        products: res.data,
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
      const res = await sellerService.getSellerOrders(page, 10, status);
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
      set({ profile: res.data });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },
}));
