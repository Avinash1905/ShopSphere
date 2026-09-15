import { create } from 'zustand';
import { Order, Invoice, ReturnRequest } from '../types';
import { orderService } from '../services';

interface OrderState {
  orders: Order[];
  totalOrders: number;
  totalPages: number;
  currentPage: number;
  selectedOrder: Order | null;
  currentInvoice: Invoice | null;
  activeStatusFilter: string;
  isLoading: boolean;
  error: string | null;

  fetchOrders: (page?: number, status?: string) => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  requestReturn: (data: Partial<ReturnRequest>) => Promise<void>;
  fetchInvoice: (orderId: string) => Promise<Invoice>;
  setStatusFilter: (status: string) => void;
  setSelectedOrder: (order: Order | null) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  totalOrders: 0,
  totalPages: 1,
  currentPage: 1,
  selectedOrder: null,
  currentInvoice: null,
  activeStatusFilter: 'all',
  isLoading: false,
  error: null,

  fetchOrders: async (page = 1, status) => {
    const filter = status || get().activeStatusFilter;
    set({ isLoading: true, error: null });
    try {
      const res = await orderService.getUserOrders(page, 10, filter);
      set({
        orders: res.data,
        totalOrders: res.pagination.total,
        totalPages: res.pagination.totalPages,
        currentPage: res.pagination.page,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await orderService.getOrderById(id);
      set({ selectedOrder: res.data, isLoading: false });
      return res.data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  cancelOrder: async (orderId, reason) => {
    set({ isLoading: true, error: null });
    try {
      const res = await orderService.cancelOrder(orderId, reason);
      set({ selectedOrder: res.data, isLoading: false });
      await get().fetchOrders(get().currentPage);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  requestReturn: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await orderService.requestReturn(data);
      if (data.orderId) {
        await get().fetchOrderById(data.orderId);
      }
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchInvoice: async (orderId) => {
    try {
      const res = await orderService.getInvoice(orderId);
      set({ currentInvoice: res.data });
      return res.data;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  setStatusFilter: (status) => {
    set({ activeStatusFilter: status });
    get().fetchOrders(1, status);
  },

  setSelectedOrder: (order) => set({ selectedOrder: order }),
}));
