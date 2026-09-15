import { create } from 'zustand';
import { Product } from '../types';
import { useCartStore } from './cartStore';

interface WishlistState {
  wishlist: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  moveToCart: (product: Product) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => {
  const loadInitialWishlist = (): Product[] => {
    try {
      const data = localStorage.getItem('shopsphere_wishlist');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveWishlist = (items: Product[]) => {
    localStorage.setItem('shopsphere_wishlist', JSON.stringify(items));
  };

  return {
    wishlist: loadInitialWishlist(),

    isInWishlist: (productId) => {
      return get().wishlist.some((p) => p.id === productId);
    },

    toggleWishlist: (product) => {
      const { wishlist } = get();
      const exists = wishlist.some((p) => p.id === product.id);
      let updated: Product[];

      if (exists) {
        updated = wishlist.filter((p) => p.id !== product.id);
      } else {
        updated = [product, ...wishlist];
      }

      saveWishlist(updated);
      set({ wishlist: updated });
    },

    removeFromWishlist: (productId) => {
      const updated = get().wishlist.filter((p) => p.id !== productId);
      saveWishlist(updated);
      set({ wishlist: updated });
    },

    clearWishlist: () => {
      saveWishlist([]);
      set({ wishlist: [] });
    },

    moveToCart: async (product) => {
      await useCartStore.getState().addItem(product.id, product.variants[0]?.id, 1);
      get().removeFromWishlist(product.id);
    },
  };
});
