/**
 * User Module Domain Entities, Types, and DTOs
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Role, AccountStatusType, AddressTypeEnum } from '../config/constants';

export interface UserEntity {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: Role;
  status: AccountStatusType;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
}

export interface UserAddressEntity {
  id: string;
  userId: string;
  recipientName: string;
  phoneNumber: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  addressType: AddressTypeEnum;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  deliveryInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferencesEntity {
  id: string;
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  orderUpdates: boolean;
  securityAlerts: boolean;
  language: string;
  currency: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileDTO {
  id: string;
  email: string;
  username: string;
  role: Role;
  status: AccountStatusType;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export function toUserProfileDTO(user: UserEntity): UserProfileDTO {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    phoneNumber: user.phoneNumber,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : undefined,
  };
}
