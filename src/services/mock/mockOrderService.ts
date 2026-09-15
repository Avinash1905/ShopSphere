import { IOrderService, CreateOrderParams } from '../api/orderService';
import { mockStorage } from './mockStorage';
import { mockCartService } from './mockCartService';
import {
  Order,
  OrderItem,
  ReturnRequest,
  Invoice,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export class MockOrderService implements IOrderService {
  async createOrder(params: CreateOrderParams): Promise<ApiResponse<Order>> {
    await mockStorage.delay(500);
    const cart = await mockCartService.getCart();
    const { items } = cart.data;

    if (items.length === 0) {
      throw new Error('Cannot create an order with an empty cart');
    }

    const summary = mockCartService.calculateSummary(items, params.couponCode);
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `ORD-2024-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderItems: OrderItem[] = items.map((item) => ({
      id: `item-${Date.now()}-${item.productId}`,
      orderId,
      productId: item.productId,
      variantId: item.variantId,
      sellerId: item.product.sellerId,
      sellerName: item.product.sellerName,
      productTitle: item.product.title,
      productImage: item.product.images[0]?.url || '',
      sku: item.variant?.sku || item.product.sku,
      attributes: item.variant?.attributes,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      product: item.product,
      variant: item.variant,
    }));

    const users = mockStorage.getUsers();
    const currentUser = users[0]; // fallback default
    const shippingAddress = currentUser.addresses?.find((a) => a.id === params.shippingAddressId) || currentUser.addresses?.[0] || {
      id: 'addr-default',
      fullName: currentUser.fullName,
      phone: currentUser.phoneNumber || '+1 (555) 000-0000',
      street: '123 Market Street',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
      country: 'United States',
    };

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: currentUser.id,
      customerName: currentUser.fullName,
      customerEmail: currentUser.email,
      customerPhone: shippingAddress.phone,
      items: orderItems,
      shippingAddress,
      billingAddress: shippingAddress,
      shippingCarrier: 'FedEx Express',
      shippingTrackingNumber: `FDX-${Math.floor(1000 + Math.random() * 9000)}-${orderNumber}`,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'payment_confirmed',
      subtotal: summary.subtotal,
      discountAmount: summary.discountAmount,
      discount: summary.discountAmount,
      couponCode: params.couponCode,
      taxAmount: summary.taxAmount,
      tax: summary.taxAmount,
      shippingCost: summary.estimatedShipping,
      shippingFee: summary.estimatedShipping,
      grandTotal: summary.grandTotal,
      total: summary.grandTotal,
      payment: params.paymentDetails,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      trackingEvents: [
        {
          id: `trk-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          status: 'payment_confirmed',
          title: 'Order Placed & Payment Authorized',
          description: `Order successfully placed for $${summary.grandTotal}. Preparing for fulfillment.`,
          location: `${shippingAddress.city}, ${shippingAddress.state}`,
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    const orders = mockStorage.getOrders();
    orders.unshift(newOrder);
    mockStorage.saveOrders(orders);

    // Clear cart after order creation
    await mockCartService.clearCart();

    // Add notification
    const notifs = mockStorage.getNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      category: 'orders',
      title: 'Order Confirmed! 🎉',
      message: `Your order ${orderNumber} has been received and is being prepared.`,
      link: `/customer/orders/${orderId}`,
      isRead: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
    });
    mockStorage.saveNotifications(notifs);

    return {
      success: true,
      data: newOrder,
      message: 'Order created successfully',
    };
  }

  async getUserOrders(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Order>> {
    await mockStorage.delay(200);
    let orders = mockStorage.getOrders();

    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }

    const total = orders.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = orders.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    await mockStorage.delay(150);
    const orders = mockStorage.getOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) throw new Error('Order not found');
    return { success: true, data: order };
  }

  async getOrderByNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    await mockStorage.delay(150);
    const orders = mockStorage.getOrders();
    const order = orders.find((o) => (o.orderNumber || o.id).toUpperCase() === orderNumber.toUpperCase());
    if (!order) throw new Error('Order not found');
    return { success: true, data: order };
  }

  async cancelOrder(orderId: string, reason: string): Promise<ApiResponse<Order>> {
    await mockStorage.delay(300);
    const orders = mockStorage.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (order.status === 'shipped' || order.status === 'delivered') {
      throw new Error('This order cannot be cancelled as it has already shipped.');
    }

    order.status = 'cancelled';
    order.cancelReason = reason;
    order.cancelledAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    order.trackingEvents = order.trackingEvents || [];
    order.trackingEvents.push({
      id: `trk-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'cancelled',
      title: 'Order Cancelled',
      description: `Cancelled by customer. Reason: ${reason}`,
      location: 'System',
    });

    mockStorage.saveOrders(orders);
    return { success: true, data: order, message: 'Order has been cancelled successfully.' };
  }

  async requestReturn(data: Partial<ReturnRequest>): Promise<ApiResponse<ReturnRequest>> {
    await mockStorage.delay(400);
    const orders = mockStorage.getOrders();
    const order = orders.find((o) => o.id === data.orderId);
    if (!order) throw new Error('Order not found');

    const item = order.items.find((i) => i.id === data.orderItemId);
    if (!item) throw new Error('Order item not found');

    const newReturn: ReturnRequest = {
      id: `ret-${Date.now()}`,
      orderId: order.id,
      orderItemId: item.id,
      userId: order.userId,
      sellerId: item.sellerId,
      reason: data.reason || 'defective',
      detailedReason: data.detailedReason || '',
      status: 'requested',
      refundAmount: item.totalPrice,
      refundMethod: data.refundMethod || 'original_payment',
      photos: data.photos || [],
      createdAt: new Date().toISOString(),
    };

    if (!order.returnRequests) order.returnRequests = [];
    order.returnRequests.push(newReturn);
    order.status = 'return_requested';
    mockStorage.saveOrders(orders);

    return { success: true, data: newReturn, message: 'Return request submitted for seller review.' };
  }

  async getInvoice(orderId: string): Promise<ApiResponse<Invoice>> {
    await mockStorage.delay(200);
    const orders = mockStorage.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const invoice: Invoice = {
      invoiceNumber: `INV-${(order.orderNumber || order.id).replace('ORD-', '')}`,
      issueDate: order.createdAt,
      dueDate: order.createdAt,
      order,
      companyDetails: {
        name: 'ShopSphere Global Commerce Inc.',
        address: '500 108th Ave NE, Suite 1200, Bellevue, WA 98004, USA',
        taxId: 'US-EIN-88-2910482',
        email: 'billing@shopsphere.market',
        phone: '+1 (800) 555-0199',
        website: 'https://shopsphere.market',
      },
    };

    return { success: true, data: invoice };
  }
}

export const mockOrderService = new MockOrderService();
