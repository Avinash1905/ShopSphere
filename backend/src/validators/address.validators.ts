/**
 * Address Management Request Validators
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v } from './validator.engine';
import { AddressType } from '../config/constants';

export const createAddressSchema = v.object({
  recipientName: v.string().required().min(2).max(100),
  phoneNumber: v.string().required().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid international phone number format'),
  streetLine1: v.string().required().min(5).max(150),
  streetLine2: v.string().optional().max(150),
  city: v.string().required().min(2).max(100),
  state: v.string().required().min(2).max(100),
  postalCode: v.string().required().min(3).max(20).matches(/^[A-Za-z0-9\s-]+$/, 'Postal code contains invalid characters'),
  countryCode: v.string().required().min(2).max(2).matches(/^[A-Z]{2}$/, 'Country code must be a 2-letter ISO code (e.g. US, IN, GB)'),
  addressType: v.string().optional().default(AddressType.SHIPPING).oneOf([
    AddressType.SHIPPING,
    AddressType.BILLING,
    AddressType.HOME,
    AddressType.WORK,
    AddressType.OTHER,
  ]),
  isDefaultShipping: v.boolean().optional().default(false),
  isDefaultBilling: v.boolean().optional().default(false),
  deliveryInstructions: v.string().optional().max(300),
});

export const updateAddressSchema = v.object({
  recipientName: v.string().optional().min(2).max(100),
  phoneNumber: v.string().optional().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid international phone number format'),
  streetLine1: v.string().optional().min(5).max(150),
  streetLine2: v.string().optional().max(150),
  city: v.string().optional().min(2).max(100),
  state: v.string().optional().min(2).max(100),
  postalCode: v.string().optional().min(3).max(20).matches(/^[A-Za-z0-9\s-]+$/, 'Postal code contains invalid characters'),
  countryCode: v.string().optional().min(2).max(2).matches(/^[A-Z]{2}$/, 'Country code must be a 2-letter ISO code (e.g. US, IN, GB)'),
  addressType: v.string().optional().oneOf([
    AddressType.SHIPPING,
    AddressType.BILLING,
    AddressType.HOME,
    AddressType.WORK,
    AddressType.OTHER,
  ]),
  isDefaultShipping: v.boolean().optional(),
  isDefaultBilling: v.boolean().optional(),
  deliveryInstructions: v.string().optional().max(300),
});

export const addressQueryFilterSchema = v.object({
  page: v.number().optional().default(1).min(1),
  limit: v.number().optional().default(20).min(1).max(50),
  addressType: v.string().optional().oneOf([
    AddressType.SHIPPING,
    AddressType.BILLING,
    AddressType.HOME,
    AddressType.WORK,
    AddressType.OTHER,
  ]),
});
