/**
 * User Profile, Preferences, and Admin Management Request Validators
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v } from './validator.engine';
import { AccountStatus, Roles } from '../config/constants';

export const updateProfileSchema = v.object({
  firstName: v.string().optional().min(1).max(50),
  lastName: v.string().optional().min(1).max(50),
  phoneNumber: v.string().optional().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid international phone number format'),
  avatarUrl: v.string().optional().matches(/^https?:\/\/.+/, 'Avatar URL must be a valid HTTP or HTTPS URL'),
  bio: v.string().optional().max(500),
  dateOfBirth: v.string().optional().matches(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  gender: v.string().optional().oneOf(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']),
});

export const updatePreferencesSchema = v.object({
  emailNotifications: v.boolean().optional(),
  smsNotifications: v.boolean().optional(),
  marketingEmails: v.boolean().optional(),
  orderUpdates: v.boolean().optional(),
  securityAlerts: v.boolean().optional(),
  language: v.string().optional().min(2).max(10).oneOf(['en', 'es', 'fr', 'de', 'hi', 'zh', 'ja']),
  currency: v.string().optional().min(3).max(3).oneOf(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY']),
  timezone: v.string().optional().max(50),
  theme: v.string().optional().oneOf(['light', 'dark', 'system']),
  twoFactorEnabled: v.boolean().optional(),
});

export const adminUpdateUserStatusSchema = v.object({
  status: v.string().required().oneOf([AccountStatus.ACTIVE, AccountStatus.INACTIVE, AccountStatus.SUSPENDED]),
  reason: v.string().optional().max(255),
});

export const userQueryFilterSchema = v.object({
  page: v.number().optional().default(1).min(1),
  limit: v.number().optional().default(20).min(1).max(100),
  role: v.string().optional().oneOf([Roles.CUSTOMER, Roles.SELLER, Roles.ADMIN]),
  status: v.string().optional().oneOf([AccountStatus.ACTIVE, AccountStatus.INACTIVE, AccountStatus.SUSPENDED]),
  search: v.string().optional().max(100),
  sortBy: v.string().optional().default('createdAt').oneOf(['createdAt', 'email', 'username', 'role', 'status']),
  sortOrder: v.string().optional().default('desc').oneOf(['asc', 'desc']),
});
