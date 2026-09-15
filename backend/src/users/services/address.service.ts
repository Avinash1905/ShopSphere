/**
 * User Address Management Service with Strict Ownership Isolation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { IAddressRepository } from '../../repositories/interfaces/IAddressRepository';
import { IAuditLogRepository } from '../../repositories/interfaces/IUserPreferenceRepository';
import { UserAddressEntity } from '../users.types';
import { AddressTypeEnum, AuditAction } from '../../config/constants';
import { NotFoundError, AuthorizationError, BusinessRuleError } from '../../core/errors/DomainErrors';
import { eventBus } from '../../core/events/EventBus';
import { logger } from '../../core/logger/Logger';

export interface CreateAddressDTO {
  recipientName: string;
  phoneNumber: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  addressType?: AddressTypeEnum;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
  deliveryInstructions?: string;
}

export interface UpdateAddressDTO {
  recipientName?: string;
  phoneNumber?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  addressType?: AddressTypeEnum;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
  deliveryInstructions?: string;
}

export class AddressService {
  private readonly addressRepo: IAddressRepository;
  private readonly auditLogRepo: IAuditLogRepository;
  private readonly maxAddressesPerUser = 20;

  constructor(addressRepo: IAddressRepository, auditLogRepo: IAuditLogRepository) {
    this.addressRepo = addressRepo;
    this.auditLogRepo = auditLogRepo;
  }

  /**
   * Creates a new address for the authenticated user
   */
  public async createAddress(userId: string, dto: CreateAddressDTO): Promise<UserAddressEntity> {
    const existingCount = await this.addressRepo.countByUserId(userId);
    if (existingCount >= this.maxAddressesPerUser) {
      throw new BusinessRuleError(
        `Address limit exceeded. A user can store a maximum of ${this.maxAddressesPerUser} addresses.`,
        'ADDR_LIMIT_EXCEEDED'
      );
    }

    // If it's the user's first address, automatically make it default shipping and billing
    const isFirstAddress = existingCount === 0;
    const isDefaultShipping = isFirstAddress ? true : dto.isDefaultShipping || false;
    const isDefaultBilling = isFirstAddress ? true : dto.isDefaultBilling || false;

    const now = new Date();
    const newAddress: UserAddressEntity = {
      id: uuidv4(),
      userId,
      recipientName: dto.recipientName.trim(),
      phoneNumber: dto.phoneNumber.trim(),
      streetLine1: dto.streetLine1.trim(),
      streetLine2: dto.streetLine2?.trim(),
      city: dto.city.trim(),
      state: dto.state.trim(),
      postalCode: dto.postalCode.trim().toUpperCase(),
      countryCode: dto.countryCode.trim().toUpperCase(),
      addressType: dto.addressType || ('SHIPPING' as AddressTypeEnum),
      isDefaultShipping,
      isDefaultBilling,
      deliveryInstructions: dto.deliveryInstructions?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.addressRepo.create(newAddress);

    await this.auditLogRepo.record(AuditAction.USER_ADDRESS_CREATE, { addressId: saved.id }, userId);

    await eventBus.publish('address.created', {
      userId,
      addressId: saved.id,
      isDefaultShipping: saved.isDefaultShipping,
      isDefaultBilling: saved.isDefaultBilling,
    });

    logger.info(`Address '${saved.id}' created for user '${userId}'`);
    return saved;
  }

  /**
   * Retrieves all addresses belonging to the authenticated user
   */
  public async getUserAddresses(
    userId: string,
    page = 1,
    limit = 20,
    type?: AddressTypeEnum
  ): Promise<{ addresses: UserAddressEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    return this.addressRepo.findByUserId(userId, skip, limit, type);
  }

  /**
   * Retrieves an address by ID with STRICT OWNERSHIP CHECK.
   * If address exists but belongs to another user, throws NotFoundError or AuthorizationError.
   */
  public async getAddressById(addressId: string, userId: string): Promise<UserAddressEntity> {
    const address = await this.addressRepo.findById(addressId);
    if (!address) {
      throw new NotFoundError('Address', addressId);
    }

    // Strict ownership verification
    if (address.userId !== userId) {
      logger.warn(`Unauthorized address access attempt: User '${userId}' tried to view Address '${addressId}' owned by '${address.userId}'`);
      throw new AuthorizationError('You are not authorized to view this address.');
    }

    return address;
  }

  /**
   * Updates an existing address with STRICT OWNERSHIP CHECK
   */
  public async updateAddress(addressId: string, userId: string, dto: UpdateAddressDTO): Promise<UserAddressEntity> {
    // Check ownership first
    await this.getAddressById(addressId, userId);

    const updated = await this.addressRepo.update(addressId, {
      ...(dto.recipientName !== undefined ? { recipientName: dto.recipientName.trim() } : {}),
      ...(dto.phoneNumber !== undefined ? { phoneNumber: dto.phoneNumber.trim() } : {}),
      ...(dto.streetLine1 !== undefined ? { streetLine1: dto.streetLine1.trim() } : {}),
      ...(dto.streetLine2 !== undefined ? { streetLine2: dto.streetLine2.trim() } : {}),
      ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
      ...(dto.state !== undefined ? { state: dto.state.trim() } : {}),
      ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode.trim().toUpperCase() } : {}),
      ...(dto.countryCode !== undefined ? { countryCode: dto.countryCode.trim().toUpperCase() } : {}),
      ...(dto.addressType !== undefined ? { addressType: dto.addressType } : {}),
      ...(dto.isDefaultShipping !== undefined ? { isDefaultShipping: dto.isDefaultShipping } : {}),
      ...(dto.isDefaultBilling !== undefined ? { isDefaultBilling: dto.isDefaultBilling } : {}),
      ...(dto.deliveryInstructions !== undefined ? { deliveryInstructions: dto.deliveryInstructions.trim() } : {}),
    });

    if (!updated) {
      throw new NotFoundError('Address', addressId);
    }

    await this.auditLogRepo.record(AuditAction.USER_ADDRESS_UPDATE, { addressId }, userId);

    await eventBus.publish('address.updated', {
      userId,
      addressId,
    });

    logger.info(`Address '${addressId}' updated for user '${userId}'`);
    return updated;
  }

  /**
   * Deletes an address with STRICT OWNERSHIP CHECK
   */
  public async deleteAddress(addressId: string, userId: string): Promise<boolean> {
    const existing = await this.getAddressById(addressId, userId);

    const wasDefaultShipping = existing.isDefaultShipping;
    const wasDefaultBilling = existing.isDefaultBilling;

    const deleted = await this.addressRepo.deleteByIdAndUserId(addressId, userId);
    if (!deleted) {
      throw new NotFoundError('Address', addressId);
    }

    // If deleted address was default, set another remaining address as default
    if (wasDefaultShipping || wasDefaultBilling) {
      const remaining = await this.addressRepo.findByUserId(userId, 0, 1);
      if (remaining.addresses.length > 0) {
        const nextDefault = remaining.addresses[0];
        if (wasDefaultShipping) {
          await this.addressRepo.setDefaultShipping(nextDefault.id, userId);
        }
        if (wasDefaultBilling) {
          await this.addressRepo.setDefaultBilling(nextDefault.id, userId);
        }
      }
    }

    await this.auditLogRepo.record(AuditAction.USER_ADDRESS_DELETE, { addressId }, userId);

    await eventBus.publish('address.deleted', {
      userId,
      addressId,
    });

    logger.info(`Address '${addressId}' deleted for user '${userId}'`);
    return true;
  }

  /**
   * Sets an address as default shipping or billing
   */
  public async setDefaultAddress(addressId: string, userId: string, type: 'shipping' | 'billing'): Promise<boolean> {
    await this.getAddressById(addressId, userId);

    let success = false;
    if (type === 'shipping') {
      success = await this.addressRepo.setDefaultShipping(addressId, userId);
    } else {
      success = await this.addressRepo.setDefaultBilling(addressId, userId);
    }

    await this.auditLogRepo.record(AuditAction.USER_ADDRESS_SET_DEFAULT, { addressId, type }, userId);
    return success;
  }
}
