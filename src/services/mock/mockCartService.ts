import { ICartService } from '../api/cartService';
import { mockStorage } from './mockStorage';
import {
  CartItem,
  CartSummary,
  SavedForLaterItem,
  ShippingOption,
  ApiResponse,
} from '../../types';

export const MOCK_SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'ship-standard',
    name: 'Standard Ground Shipping',
    carrier: 'USPS / UPS Ground',
    description: 'Delivered in 4-6 business days.',
    estimatedDays: '4-6 days',
    cost: 5.99,
    isFreeThreshold: 75.0,
  },
  {
    id: 'ship-express',
    name: 'Express 2-Day Air',
    carrier: 'FedEx Express',
    description: 'Guaranteed 2-day delivery with real-time tracking.',
    estimatedDays: '2 days',
    cost: 14.99,
  },
  {
    id: 'ship-overnight',
    name: 'Priority Overnight',
    carrier: 'FedEx Priority Overnight',
    description: 'Next business day delivery before 10:30 AM.',
    estimatedDays: '1 day',
    cost: 29.99,
  },
];

export class MockCartService implements ICartService {
  private getStoredItems(): CartItem[] {
    return mockStorage.getItem<CartItem[]>('shopsphere_mock_cart_items', []);
  }

  private saveStoredItems(items: CartItem[]): void {
    mockStorage.set('shopsphere_mock_cart_items', items);
  }

  private getStoredSavedItems(): SavedForLaterItem[] {
    return mockStorage.getItem<SavedForLaterItem[]>('shopsphere_mock_saved_items', []);
  }

  private saveStoredSavedItems(items: SavedForLaterItem[]): void {
    mockStorage.set('shopsphere_mock_saved_items', items);
  }

  public calculateSummary(items: CartItem[], appliedCouponCode?: string): CartSummary {
    const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    const freeShippingThreshold = 75.0;

    let discountAmount = 0;
    let appliedCoupon = null;

    if (appliedCouponCode) {
      const coupons = mockStorage.getCoupons();
      const coupon = coupons.find((c) => c.code.toUpperCase() === appliedCouponCode.toUpperCase() && c.status === 'active');
      if (coupon && subtotal >= coupon.minimumOrderAmount) {
        if (coupon.discountType === 'percentage') {
          const rawDiscount = (subtotal * coupon.discountValue) / 100;
          discountAmount = coupon.maximumDiscountAmount
            ? Math.min(rawDiscount, coupon.maximumDiscountAmount)
            : rawDiscount;
        } else if (coupon.discountType === 'fixed_amount') {
          discountAmount = Math.min(coupon.discountValue, subtotal);
        } else if (coupon.discountType === 'free_shipping') {
          discountAmount = 0; // handled in shipping
        }

        appliedCoupon = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
          description: coupon.description,
        };
      }
    }

    const estimatedShipping =
      subtotal === 0 || subtotal >= freeShippingThreshold || appliedCoupon?.discountType === 'free_shipping'
        ? 0
        : 5.99;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxableAmount * 0.085).toFixed(2));
    const grandTotal = Number((taxableAmount + taxAmount + estimatedShipping).toFixed(2));
    const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

    return {
      itemsCount: items.length,
      totalQuantity,
      subtotal,
      discountAmount,
      appliedCoupon,
      taxAmount,
      estimatedShipping,
      grandTotal,
      freeShippingThreshold,
      amountNeededForFreeShipping,
    };
  }

  async getCart(): Promise<ApiResponse<{ items: CartItem[]; summary: CartSummary }>> {
    await mockStorage.delay(100);
    const items = this.getStoredItems();
    const summary = this.calculateSummary(items);
    return {
      success: true,
      data: { items, summary },
    };
  }

  async addItem(productId: string, variantId?: string, quantity = 1): Promise<ApiResponse<CartItem>> {
    await mockStorage.delay(200);
    const products = mockStorage.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const variant = variantId ? product.variants.find((v) => v.id === variantId) : undefined;
    const unitPrice = variant ? variant.price : product.price;
    const items = this.getStoredItems();

    const existingIndex = items.findIndex(
      (item) => item.productId === productId && item.variantId === variantId
    );

    let updatedItem: CartItem;

    if (existingIndex > -1) {
      const newQty = items[existingIndex].quantity + quantity;
      items[existingIndex].quantity = newQty;
      items[existingIndex].totalPrice = newQty * unitPrice;
      updatedItem = items[existingIndex];
    } else {
      updatedItem = {
        id: `cart-${productId}-${variantId || 'default'}-${Date.now()}`,
        productId,
        variantId,
        product,
        variant,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        selectedAttributes: variant?.attributes,
        isAvailable: true,
        maxAvailableQuantity: variant ? variant.inventoryQuantity : product.totalInventory,
        addedAt: new Date().toISOString(),
      };
      items.push(updatedItem);
    }

    this.saveStoredItems(items);
    return { success: true, data: updatedItem, message: 'Added to cart' };
  }

  async updateQuantity(itemId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    await mockStorage.delay(100);
    const items = this.getStoredItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found in cart');

    if (quantity <= 0) {
      return this.removeItem(itemId) as any;
    }

    item.quantity = quantity;
    item.totalPrice = quantity * item.unitPrice;
    this.saveStoredItems(items);

    return { success: true, data: item };
  }

  async removeItem(itemId: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(100);
    let items = this.getStoredItems();
    items = items.filter((i) => i.id !== itemId);
    this.saveStoredItems(items);
    return { success: true, data: { success: true } };
  }

  async clearCart(): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(100);
    this.saveStoredItems([]);
    return { success: true, data: { success: true } };
  }

  async saveForLater(itemId: string): Promise<ApiResponse<SavedForLaterItem>> {
    await mockStorage.delay(150);
    const items = this.getStoredItems();
    const itemIndex = items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) throw new Error('Item not found in cart');

    const item = items[itemIndex];
    items.splice(itemIndex, 1);
    this.saveStoredItems(items);

    const savedItems = this.getStoredSavedItems();
    const newSaved: SavedForLaterItem = {
      id: `saved-${Date.now()}`,
      productId: item.productId,
      variantId: item.variantId,
      product: item.product,
      variant: item.variant,
      savedAt: new Date().toISOString(),
    };
    savedItems.unshift(newSaved);
    this.saveStoredSavedItems(savedItems);

    return { success: true, data: newSaved };
  }

  async moveToCart(savedItemId: string): Promise<ApiResponse<CartItem>> {
    await mockStorage.delay(150);
    let savedItems = this.getStoredSavedItems();
    const saved = savedItems.find((s) => s.id === savedItemId);
    if (!saved) throw new Error('Saved item not found');

    savedItems = savedItems.filter((s) => s.id !== savedItemId);
    this.saveStoredSavedItems(savedItems);

    return this.addItem(saved.productId, saved.variantId, 1);
  }

  async getSavedForLater(): Promise<ApiResponse<SavedForLaterItem[]>> {
    await mockStorage.delay(100);
    return { success: true, data: this.getStoredSavedItems() };
  }

  async removeSavedItem(savedItemId: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(100);
    let savedItems = this.getStoredSavedItems();
    savedItems = savedItems.filter((s) => s.id !== savedItemId);
    this.saveStoredSavedItems(savedItems);
    return { success: true, data: { success: true } };
  }

  async getShippingOptions(): Promise<ApiResponse<ShippingOption[]>> {
    await mockStorage.delay(100);
    return { success: true, data: MOCK_SHIPPING_OPTIONS };
  }
}

export const mockCartService = new MockCartService();
