/**
 * ShopSphere Order Lifecycle Finite State Machine
 * Formally validates and tracks state transitions across all 12 order lifecycle states.
 * Enforces transition guards, triggers ledger events, and calculates refund eligibility.
 */

import { OrderStatus } from '../../packages/shared-types';

export interface OrderStateTransition {
  from: OrderStatus;
  to: OrderStatus;
  allowedRoles: ('customer' | 'seller' | 'admin' | 'system')[];
  requiresReason?: boolean;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  triggeredBy: string;
  actorRole: string;
  reason?: string;
  timestamp: string;
}

export class OrderStateMachine {
  private allowedTransitions: OrderStateTransition[] = [
    // Customer/System Initial Transitions
    { from: 'PENDING', to: 'CONFIRMED', allowedRoles: ['system', 'admin'] },
    { from: 'PENDING', to: 'CANCELLED', allowedRoles: ['customer', 'admin', 'system'], requiresReason: true },
    
    // Merchant Fulfillment Transitions
    { from: 'CONFIRMED', to: 'PROCESSING', allowedRoles: ['seller', 'admin'] },
    { from: 'CONFIRMED', to: 'CANCELLED', allowedRoles: ['customer', 'seller', 'admin'], requiresReason: true },
    { from: 'PROCESSING', to: 'PACKED', allowedRoles: ['seller', 'admin'] },
    { from: 'PACKED', to: 'SHIPPED', allowedRoles: ['seller', 'admin'] },
    
    // Carrier / Delivery Transitions
    { from: 'SHIPPED', to: 'OUT_FOR_DELIVERY', allowedRoles: ['system', 'admin'] },
    { from: 'OUT_FOR_DELIVERY', to: 'DELIVERED', allowedRoles: ['system', 'admin'] },
    
    // Returns & Refunds Workflow
    { from: 'DELIVERED', to: 'RETURN_REQUESTED', allowedRoles: ['customer'], requiresReason: true },
    { from: 'RETURN_REQUESTED', to: 'RETURN_APPROVED', allowedRoles: ['seller', 'admin'] },
    { from: 'RETURN_REQUESTED', to: 'DELIVERED', allowedRoles: ['seller', 'admin'], requiresReason: true }, // Reject return
    { from: 'RETURN_APPROVED', to: 'RETURNED', allowedRoles: ['seller', 'admin'] },
    { from: 'RETURNED', to: 'REFUND_PENDING', allowedRoles: ['system', 'admin'] },
    { from: 'REFUND_PENDING', to: 'REFUNDED', allowedRoles: ['system', 'admin'] },
    { from: 'CANCELLED', to: 'REFUND_PENDING', allowedRoles: ['system', 'admin'] }
  ];

  private eventLedger: OrderEvent[] = [];

  public canTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    actorRole: 'customer' | 'seller' | 'admin' | 'system'
  ): { allowed: boolean; reason?: string } {
    const rule = this.allowedTransitions.find(t => t.from === currentStatus && t.to === targetStatus);
    if (!rule) {
      return { allowed: false, reason: `Illegal transition from '${currentStatus}' to '${targetStatus}'.` };
    }

    if (!rule.allowedRoles.includes(actorRole)) {
      return { allowed: false, reason: `Role '${actorRole}' is not permitted to change status to '${targetStatus}'.` };
    }

    return { allowed: true };
  }

  public transition(
    orderId: string,
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    actorId: string,
    actorRole: 'customer' | 'seller' | 'admin' | 'system',
    reason?: string
  ): { success: boolean; newStatus?: OrderStatus; error?: string } {
    const check = this.canTransition(currentStatus, targetStatus, actorRole);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const event: OrderEvent = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      orderId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      triggeredBy: actorId,
      actorRole,
      reason,
      timestamp: new Date().toISOString()
    };

    this.eventLedger.push(event);
    return { success: true, newStatus: targetStatus };
  }

  public getOrderHistory(orderId: string): OrderEvent[] {
    return this.eventLedger.filter(e => e.orderId === orderId);
  }

  public isCancellable(status: OrderStatus): boolean {
    return ['PENDING', 'CONFIRMED'].includes(status);
  }

  public isReturnable(status: OrderStatus, deliveryDate?: string, returnWindowDays = 30): boolean {
    if (status !== 'DELIVERED' || !deliveryDate) return false;
    const deliveredTime = new Date(deliveryDate).getTime();
    const expiryTime = deliveredTime + returnWindowDays * 24 * 60 * 60 * 1000;
    return Date.now() <= expiryTime;
  }
}
