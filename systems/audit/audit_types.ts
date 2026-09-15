export type AuditActorType = 'USER' | 'SYSTEM' | 'ANONYMOUS' | 'SERVICE' | 'CRON';
export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING';

export enum AuditAction {
  // Authentication
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGIN_SUCCESS = 'USER_LOGIN_SUCCESS',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_LOGOUT = 'USER_LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TWO_FACTOR_TOGGLED = 'TWO_FACTOR_TOGGLED',

  // Catalog
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  PRODUCT_STATUS_CHANGED = 'PRODUCT_STATUS_CHANGED',

  // Inventory
  STOCK_RESERVED = 'STOCK_RESERVED',
  STOCK_RELEASED = 'STOCK_RELEASED',
  STOCK_FULFILLED = 'STOCK_FULFILLED',
  STOCK_ADJUSTED = 'STOCK_ADJUSTED',

  // Orders & Payments
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_AUTHORIZED = 'PAYMENT_AUTHORIZED',
  PAYMENT_CAPTURED = 'PAYMENT_CAPTURED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',

  // Promotions & Discounts
  COUPON_CREATED = 'COUPON_CREATED',
  COUPON_APPLIED = 'COUPON_APPLIED',
  COUPON_DEACTIVATED = 'COUPON_DEACTIVATED',

  // Merchant & Admin
  SELLER_VERIFICATION_UPDATED = 'SELLER_VERIFICATION_UPDATED',
  SELLER_PAYOUT_TRIGGERED = 'SELLER_PAYOUT_TRIGGERED',
  ADMIN_ROLE_ASSIGNED = 'ADMIN_ROLE_ASSIGNED',
  ADMIN_PERMISSION_MODIFIED = 'ADMIN_PERMISSION_MODIFIED',

  // Security
  SECURITY_THREAT_BLOCKED = 'SECURITY_THREAT_BLOCKED',
  RATE_LIMIT_PENALTY = 'RATE_LIMIT_PENALTY',
}

export interface AuditRecordPayload {
  id?: string;
  actorId?: string;
  actorType?: AuditActorType;
  actorEmail?: string;
  action: AuditAction | string;
  entityName: string;
  entityId: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  status?: AuditStatus;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
  timestamp?: string;
}
