import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../store/cartStore';
import { MOCK_PRODUCTS } from '../constants/products';

describe('Zustand Cart Store', () => {
  const prod = MOCK_PRODUCTS[0];

  beforeEach(async () => {
    const store = useCartStore.getState();
    await store.clearCart();
    store.closeCartDrawer();
  });

  it('initializes with empty cart items', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.summary.itemsCount).toBe(0);
    expect(state.summary.subtotal).toBe(0);
  });

  it('adds a product to cart and updates summary metrics', async () => {
    const store = useCartStore.getState();
    await store.addToCart(prod, 2);

    const updated = useCartStore.getState();
    expect(updated.items.length).toBeGreaterThan(0);
    const addedItem = updated.items.find((i) => i.productId === prod.id);
    expect(addedItem).toBeDefined();
    expect(addedItem?.quantity).toBe(2);
    expect(updated.summary.subtotal).toBe(prod.price * 2);
  });

  it('updates quantity of existing cart item', async () => {
    const store = useCartStore.getState();
    await store.addToCart(prod, 1);

    let current = useCartStore.getState();
    const itemId = current.items[0].id;

    await store.updateQuantity(itemId, 4);

    current = useCartStore.getState();
    expect(current.items[0].quantity).toBe(4);
    expect(current.summary.subtotal).toBe(prod.price * 4);
  });

  it('removes item from cart', async () => {
    const store = useCartStore.getState();
    await store.addToCart(prod, 1);

    let current = useCartStore.getState();
    const itemId = current.items[0].id;

    await store.removeItem(itemId);

    current = useCartStore.getState();
    expect(current.items.length).toBe(0);
    expect(current.summary.subtotal).toBe(0);
  });

  it('toggles cart drawer open and closed state', () => {
    const store = useCartStore.getState();
    expect(store.isCartDrawerOpen).toBe(false);

    store.openCartDrawer();
    expect(useCartStore.getState().isCartDrawerOpen).toBe(true);

    store.closeCartDrawer();
    expect(useCartStore.getState().isCartDrawerOpen).toBe(false);
  });
});
