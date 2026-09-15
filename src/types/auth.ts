import { Address } from './common';

export type UserRole = 'customer' | 'seller' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_verification';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  defaultShippingAddressId?: string;
  addresses?: Address[];
  sellerProfileId?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: UserRole;
  phoneNumber?: string;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}
