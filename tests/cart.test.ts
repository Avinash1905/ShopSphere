import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../src/store/cartStore';
import { MOCK_PRODUCTS } from '../src/constants/products';

describe('Cart Domain & State Management Tests', () => {
  const sampleProduct = MOCK_PRODUCTS[0];

  beforeEach(async () => {
    const store = useCartStore.getState();
    await store.clearCart();
    store.closeCartDrawer();
  });

  it('should initialize with an empty cart state', () => {
    const { items, summary } = useCartStore.getState();
    expect(items).toEqual([]);
    expect(summary.itemsCount).toBe(0);
    expect(summary.subtotal).toBe(0);
  });

  it('should accurately calculate subtotal when items are added', async () => {
    const store = useCartStore.getState();
    await store.addToCart(sampleProduct, 2);

    const updated = useCartStore.getState();
    expect(updated.items.length).toBeGreaterThan(0);
    expect(updated.summary.subtotal).toBe(sampleProduct.price * 2);
    expect(updated.summary.itemsCount).toBeGreaterThanOrEqual(1);
  });

  it('should update item quantities and recalculate summary metrics', async () => {
    const store = useCartStore.getState();
    await store.addToCart(sampleProduct, 1);

    let current = useCartStore.getState();
    const itemId = current.items[0].id;

    await store.updateQuantity(itemId, 3);
    current = useCartStore.getState();
    expect(current.items[0].quantity).toBe(3);
    expect(current.summary.subtotal).toBe(sampleProduct.price * 3);
  });
});
