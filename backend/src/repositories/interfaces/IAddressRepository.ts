/**
 * Address Repository Interface (Member 3 Clean Architecture Boundary)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IBaseRepository } from './IBaseRepository';
import { UserAddressEntity } from '../../users/users.types';
import { AddressTypeEnum } from '../../config/constants';

export interface IAddressRepository extends IBaseRepository<UserAddressEntity, string> {
  findByUserId(userId: string, skip?: number, limit?: number, type?: AddressTypeEnum): Promise<{ addresses: UserAddressEntity[]; total: number }>;
  findByIdAndUserId(id: string, userId: string): Promise<UserAddressEntity | null>;
  countByUserId(userId: string): Promise<number>;
  findDefaultShipping(userId: string): Promise<UserAddressEntity | null>;
  findDefaultBilling(userId: string): Promise<UserAddressEntity | null>;
  setDefaultShipping(id: string, userId: string): Promise<boolean>;
  setDefaultBilling(id: string, userId: string): Promise<boolean>;
  clearDefaultShipping(userId: string): Promise<void>;
  clearDefaultBilling(userId: string): Promise<void>;
  deleteByIdAndUserId(id: string, userId: string): Promise<boolean>;
}
