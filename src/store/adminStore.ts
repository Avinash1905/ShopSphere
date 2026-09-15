import { create } from 'zustand';
import {
  PlatformStats,
  User,
  SellerProfile,
  Product,
  ProductReview,
  AuditLog,
  PlatformSettings,
} from '../types';
import { adminService } from '../services';

interface AdminState {
  stats: PlatformStats | null;
  users: User[];
  totalUsers: number;
  sellers: SellerProfile[];
  totalSellers: number;
  pendingProducts: Product[];
  totalPendingProducts: number;
  flaggedReviews: ProductReview[];
  auditLogs: AuditLog[];
  settings: PlatformSettings | null;
  isLoading: boolean;
  error: string | null;

  fetchPlatformOverview: () => Promise<void>;
  fetchUsers: (page?: number, role?: string, status?: string) => Promise<void>;
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'banned', reason: string) => Promise<void>;
  fetchSellers: (page?: number, status?: string) => Promise<void>;
  moderateSeller: (sellerId: string, action: 'approve' | 'reject' | 'suspend', commission?: number, notes?: string) => Promise<void>;
  fetchPendingProducts: (page?: number) => Promise<void>;
  moderateProduct: (productId: string, action: 'approve' | 'reject', feedback?: string) => Promise<void>;
  fetchFlaggedReviews: (page?: number) => Promise<void>;
  moderateReview: (reviewId: string, action: 'publish' | 'hide' | 'delete') => Promise<void>;
  fetchAuditLogs: (page?: number) => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<PlatformSettings>) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  users: [],
  totalUsers: 0,
  sellers: [],
  totalSellers: 0,
  pendingProducts: [],
  totalPendingProducts: 0,
  flaggedReviews: [],
  auditLogs: [],
  settings: null,
  isLoading: false,
  error: null,

  fetchPlatformOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await adminService.getPlatformStats();
      set({ stats: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchUsers: async (page = 1, role, status) => {
    set({ isLoading: true });
    try {
      const res = await adminService.getUsers(page, 10, role, status);
      set({
        users: res.data,
        totalUsers: res.pagination.total,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateUserStatus: async (userId, status, reason) => {
    try {
      await adminService.updateUserStatus(userId, status, reason);
      await get().fetchUsers();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchSellers: async (page = 1, status) => {
    set({ isLoading: true });
    try {
      const res = await adminService.getSellers(page, 10, status);
      set({
        sellers: res.data,
        totalSellers: res.pagination.total,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  moderateSeller: async (sellerId, action, commission, notes) => {
    try {
      await adminService.moderateSeller(sellerId, action, commission, notes);
      await get().fetchSellers();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchPendingProducts: async (page = 1) => {
    set({ isLoading: true });
    try {
      const res = await adminService.getPendingProducts(page, 10);
      set({
        pendingProducts: res.data,
        totalPendingProducts: res.pagination.total,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  moderateProduct: async (productId, action, feedback) => {
    try {
      await adminService.moderateProduct(productId, action, feedback);
      await get().fetchPendingProducts();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchFlaggedReviews: async (page = 1) => {
    try {
      const res = await adminService.getFlaggedReviews(page, 10);
      set({ flaggedReviews: res.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  moderateReview: async (reviewId, action) => {
    try {
      await adminService.moderateReview(reviewId, action);
      await get().fetchFlaggedReviews();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchAuditLogs: async (page = 1) => {
    try {
      const res = await adminService.getAuditLogs(page, 15);
      set({ auditLogs: res.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchSettings: async () => {
    try {
      const res = await adminService.getPlatformSettings();
      set({ settings: res.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateSettings: async (newSettings) => {
    set({ isLoading: true });
    try {
      const res = await adminService.updatePlatformSettings(newSettings);
      set({ settings: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
