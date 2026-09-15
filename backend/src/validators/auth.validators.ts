/**
 * Authentication Schemas and Request Validators
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v } from './validator.engine';
import { Roles } from '../config/constants';

export const registerSchema = v.object({
  email: v.string().required().email().lowercase().max(100),
  username: v.string().required().min(3).max(30).matches(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  password: v.string().required().min(8).max(128),
  firstName: v.string().required().min(1).max(50),
  lastName: v.string().required().min(1).max(50),
  role: v.string().optional().default(Roles.CUSTOMER).oneOf([Roles.CUSTOMER, Roles.SELLER], 'Allowed registration roles are CUSTOMER or SELLER only'),
  phoneNumber: v.string().optional().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid international phone number format'),
});

export const loginSchema = v.object({
  emailOrUsername: v.string().required().min(3).max(100),
  password: v.string().required().min(1).max(128),
  rememberMe: v.boolean().optional().default(false),
});

export const refreshTokenSchema = v.object({
  refreshToken: v.string().required().min(20).max(500),
});

export const forgotPasswordSchema = v.object({
  email: v.string().required().email().lowercase(),
});

export const resetPasswordSchema = v.object({
  token: v.string().required().min(20).max(256),
  newPassword: v.string().required().min(8).max(128),
  confirmPassword: v.string().required().min(8).max(128),
}).custom((data) => {
  if (data.newPassword !== data.confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
});

export const changePasswordSchema = v.object({
  currentPassword: v.string().required().min(1).max(128),
  newPassword: v.string().required().min(8).max(128),
  confirmPassword: v.string().required().min(8).max(128),
}).custom((data) => {
  if (data.newPassword !== data.confirmPassword) {
    return 'New password and confirmation do not match';
  }
  if (data.currentPassword === data.newPassword) {
    return 'New password must be different from current password';
  }
  return null;
});

export const revokeSessionSchema = v.object({
  sessionId: v.string().required().uuid(),
});
