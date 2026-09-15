import { create } from 'zustand';
import { CartItem, CartSummary, SavedForLaterItem } from '../types';
import { cartService, couponService } from '../services';

interface CartState {
  items: CartItem[];
  summary: CartSummary;
  savedItems: SavedForLaterItem[];
  isCartDrawerOpen: boolean;
  isLoading: boolean;
  appliedCouponCode: string | null;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  saveForLater: (itemId: string) => Promise<void>;
  moveToCart: (savedItemId: string) => Promise<void>;
  fetchSavedItems: () => Promise<void>;
  removeSavedItem: (savedItemId: string) => Promise<void>;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleCartDrawer: () => void;
}

const DEFAULT_SUMMARY: CartSummary = {
  itemsCount: 0,
  totalQuantity: 0,
  subtotal: 0,
  discountAmount: 0,
  taxAmount: 0,
  estimatedShipping: 0,
  grandTotal: 0,
  freeShippingThreshold: 75.0,
  amountNeededForFreeShipping: 75.0,
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  summary: DEFAULT_SUMMARY,
  savedItems: [],
  isCartDrawerOpen: false,
  isLoading: false,
  appliedCouponCode: null,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await cartService.getCart();
      set({
        items: res.data.items,
        summary: res.data.summary,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addItem: async (productId, variantId, quantity = 1) => {
    set({ isLoading: true });
    try {
      await cartService.addItem(productId, variantId, quantity);
      await get().fetchCart();
      set({ isCartDrawerOpen: true });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      await cartService.updateQuantity(itemId, quantity);
      await get().fetchCart();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  removeItem: async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      await get().fetchCart();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  clearCart: async () => {
    try {
      await cartService.clearCart();
      set({ items: [], summary: DEFAULT_SUMMARY, appliedCouponCode: null });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  applyCoupon: async (code) => {
    const { summary } = get();
    set({ isLoading: true, error: null });
    try {
      const res = await couponService.validateCoupon(code, summary.subtotal);
      if (!res.data.isValid) {
        throw new Error(res.data.errorMessage || 'Invalid coupon code');
      }
      set({ appliedCouponCode: code });
      await get().fetchCart();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  removeCoupon: () => {
    set({ appliedCouponCode: null });
    get().fetchCart();
  },

  saveForLater: async (itemId) => {
    try {
      await cartService.saveForLater(itemId);
      await get().fetchCart();
      await get().fetchSavedItems();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  moveToCart: async (savedItemId) => {
    try {
      await cartService.moveToCart(savedItemId);
      await get().fetchCart();
      await get().fetchSavedItems();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchSavedItems: async () => {
    try {
      const res = await cartService.getSavedForLater();
      set({ savedItems: res.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  removeSavedItem: async (savedItemId) => {
    try {
      await cartService.removeSavedItem(savedItemId);
      await get().fetchSavedItems();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  toggleCartDrawer: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),
}));
