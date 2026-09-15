/**
 * User Repository Interface (Member 3 Clean Architecture Boundary)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IBaseRepository } from './IBaseRepository';
import { UserEntity } from '../../users/users.types';
import { AccountStatusType, Role } from '../../config/constants';

export interface UserSearchCriteria {
  role?: Role;
  status?: AccountStatusType;
  search?: string; // matches email, username, firstName, lastName
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface IUserRepository extends IBaseRepository<UserEntity, string> {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  findByEmailOrUsername(identifier: string): Promise<UserEntity | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  searchUsers(criteria: UserSearchCriteria, skip?: number, limit?: number, sortBy?: keyof UserEntity, sortOrder?: 'asc' | 'desc'): Promise<{ users: UserEntity[]; total: number }>;
  updateStatus(userId: string, status: AccountStatusType): Promise<UserEntity | null>;
  updatePassword(userId: string, newPasswordHash: string): Promise<boolean>;
  updateLastLogin(userId: string, loginTime: Date): Promise<void>;
}
