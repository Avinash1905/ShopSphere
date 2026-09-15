import { create } from 'zustand';
import { Order, Invoice, ReturnRequest } from '../types';
import { orderService } from '../services';

interface OrderState {
  orders: Order[];
  totalOrders: number;
  totalPages: number;
  currentPage: number;
  selectedOrder: Order | null;
  currentOrder: Order | null;
  currentInvoice: Invoice | null;
  activeStatusFilter: string;
  isLoading: boolean;
  error: string | null;

  fetchOrders: (page?: number, status?: string) => Promise<void>;
  fetchUserOrders: (page?: number, status?: string) => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order>;
  getOrderById: (id: string) => Promise<Order>;
  placeOrder: (data: any) => Promise<Order>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  requestReturn: (orderIdOrData: string | Partial<ReturnRequest>, reason?: string) => Promise<void>;
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
  currentOrder: null,
  currentInvoice: null,
  activeStatusFilter: 'all',
  isLoading: false,
  error: null,

  fetchOrders: async (page = 1, status) => {
    const filter = status || get().activeStatusFilter;
    set({ isLoading: true, error: null });
    try {
      const res = await orderService.getUserOrders(page, 50, filter);
      const mapped = res.data.map((o) => ({
        ...o,
        total: o.total || o.grandTotal || 0,
        subtotal: o.subtotal || 0,
        tax: o.tax || o.taxAmount || 0,
        discount: o.discount || o.discountAmount || 0,
        shippingFee: o.shippingFee || o.shippingCost || 0,
      }));
      set({
        orders: mapped,
        totalOrders: res.pagination.total,
        totalPages: res.pagination.totalPages,
        currentPage: res.pagination.page,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchUserOrders: async (page = 1, status) => {
    await get().fetchOrders(page, status);
  },

  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await orderService.getOrderById(id);
      const ord = {
        ...res.data,
        total: res.data.total || res.data.grandTotal || 0,
        subtotal: res.data.subtotal || 0,
        tax: res.data.tax || res.data.taxAmount || 0,
        discount: res.data.discount || res.data.discountAmount || 0,
        shippingFee: res.data.shippingFee || res.data.shippingCost || 0,
      };
      set({ selectedOrder: ord, currentOrder: ord, isLoading: false });
      return ord;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  getOrderById: async (id) => {
    return await get().fetchOrderById(id);
  },

  placeOrder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        orderNumber: `ORD-${Date.now()}`,
        userId: 'usr_1',
        customerName: data.shippingAddress?.fullName || 'Alex Morgan',
        customerEmail: 'alex.morgan@example.com',
        customerPhone: data.shippingAddress?.phone || '+1 555 234 5678',
        items: data.items || [],
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        shippingCarrier: data.shippingMethod?.carrier || 'FedEx Express',
        shippingMethod: data.shippingMethod,
        paymentMethod: data.paymentMethod,
        estimatedDeliveryDate: 'In 3-5 business days',
        status: 'confirmed',
        subtotal: data.subtotal,
        discountAmount: data.discount || 0,
        discount: data.discount || 0,
        taxAmount: data.tax || 0,
        tax: data.tax || 0,
        shippingCost: data.shippingFee || 0,
        shippingFee: data.shippingFee || 0,
        grandTotal: data.total,
        total: data.total,
        payment: {
          method: data.paymentMethod?.type || 'credit_card',
          status: 'completed',
          amount: data.total,
        },
        trackingEvents: [],
        createdAt: new Date().toISOString(),
      };
      set({
        orders: [newOrder, ...get().orders],
        selectedOrder: newOrder,
        currentOrder: newOrder,
        isLoading: false,
      });
      return newOrder;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  cancelOrder: async (orderId, reason = 'Customer cancellation') => {
    set({ isLoading: true, error: null });
    try {
      await orderService.cancelOrder(orderId, reason);
      const updated = get().orders.map((o) =>
        o.id === orderId ? { ...o, status: 'cancelled' as const, cancelReason: reason } : o
      );
      const curr = get().currentOrder;
      set({
        orders: updated,
        currentOrder: curr?.id === orderId ? { ...curr, status: 'cancelled' as const } : curr,
        selectedOrder: curr?.id === orderId ? { ...curr, status: 'cancelled' as const } : curr,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  requestReturn: async (orderIdOrData, reason) => {
    set({ isLoading: true, error: null });
    try {
      const orderId = typeof orderIdOrData === 'string' ? orderIdOrData : orderIdOrData.orderId || '';
      const returnObj = typeof orderIdOrData === 'object' ? orderIdOrData : { orderId, detailedReason: reason || '' };
      await orderService.requestReturn(returnObj);
      const updated = get().orders.map((o) =>
        o.id === orderId ? { ...o, status: 'returned' as const } : o
      );
      const curr = get().currentOrder;
      set({
        orders: updated,
        currentOrder: curr?.id === orderId ? { ...curr, status: 'returned' as const } : curr,
        selectedOrder: curr?.id === orderId ? { ...curr, status: 'returned' as const } : curr,
        isLoading: false,
      });
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

  setSelectedOrder: (order) => set({ selectedOrder: order, currentOrder: order }),
}));
