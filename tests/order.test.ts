import { describe, it, expect } from 'vitest';
import { orderRepository } from '../database/repositories/OrderRepository';

describe('Order State Transitions & Repository Tests', () => {
  it('should create and retrieve order entity with correct initial state', async () => {
    const newOrder = await orderRepository.create({
      id: 'ord-test-unit-1',
      userId: 'usr-customer-1',
      totalAmount: 399.99,
      status: 'pending',
      shippingAddress: {
        street: '123 Market St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94103',
        country: 'US'
      },
      items: [
        {
          id: 'item-1',
          productId: 'prod-sony-wh1000xm5',
          title: 'Sony WH-1000XM5',
          quantity: 1,
          price: 399.99,
          sellerId: 'seller-tech-vault'
        }
      ]
    });

    expect(newOrder.id).toBe('ord-test-unit-1');
    expect(newOrder.status).toBe('pending');
    expect(newOrder.totalAmount).toBe(399.99);

    const retrieved = await orderRepository.findById('ord-test-unit-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.items).toHaveLength(1);
  });

  it('should update order status through valid lifecycle stages', async () => {
    const updated = await orderRepository.update('ord-test-unit-1', {
      status: 'processing'
    });
    expect(updated?.status).toBe('processing');
  });
});
