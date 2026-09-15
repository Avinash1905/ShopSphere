/**
 * Domain Event Definitions for Phase 1
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

export interface BaseDomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  timestamp: string;
  correlationId?: string;
  payload: T;
}

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  status: string;
}

export interface UserLoggedInPayload {
  userId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  loginTime: string;
}

export interface UserLoginFailedPayload {
  email: string;
  ipAddress?: string;
  userAgent?: string;
  attemptCount: number;
  locked: boolean;
  lockoutExpiresAt?: string;
}

export interface UserPasswordChangedPayload {
  userId: string;
  changedAt: string;
  sessionsRevokedCount: number;
}

export interface PasswordResetRequestedPayload {
  userId: string;
  email: string;
  resetToken: string;
  expiresAt: string;
}

export interface PasswordResetCompletedPayload {
  userId: string;
  completedAt: string;
}

export interface AddressCreatedPayload {
  userId: string;
  addressId: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface AddressUpdatedPayload {
  userId: string;
  addressId: string;
}

export interface AddressDeletedPayload {
  userId: string;
  addressId: string;
}

export interface UserStatusChangedPayload {
  userId: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  reason?: string;
}

export interface UserPreferencesUpdatedPayload {
  userId: string;
  updatedFields: string[];
}

export interface SecurityTokenReuseDetectedPayload {
  userId: string;
  familyId: string;
  compromisedTokenHash: string;
  detectedAt: string;
}

export type DomainEventMap = {
  'user.registered': BaseDomainEvent<UserRegisteredPayload>;
  'user.logged_in': BaseDomainEvent<UserLoggedInPayload>;
  'user.login_failed': BaseDomainEvent<UserLoginFailedPayload>;
  'user.password_changed': BaseDomainEvent<UserPasswordChangedPayload>;
  'user.password_reset_requested': BaseDomainEvent<PasswordResetRequestedPayload>;
  'user.password_reset_completed': BaseDomainEvent<PasswordResetCompletedPayload>;
  'user.status_changed': BaseDomainEvent<UserStatusChangedPayload>;
  'address.created': BaseDomainEvent<AddressCreatedPayload>;
  'address.updated': BaseDomainEvent<AddressUpdatedPayload>;
  'address.deleted': BaseDomainEvent<AddressDeletedPayload>;
  'preferences.updated': BaseDomainEvent<UserPreferencesUpdatedPayload>;
  'security.token_reuse': BaseDomainEvent<SecurityTokenReuseDetectedPayload>;
};

export type EventKey = keyof DomainEventMap;
