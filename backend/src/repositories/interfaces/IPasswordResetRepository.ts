/**
 * Password Reset Repository Interface (Member 3 Clean Architecture Boundary)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IBaseRepository } from './IBaseRepository';
import { PasswordResetEntity } from '../../auth/auth.types';

export interface IPasswordResetRepository extends IBaseRepository<PasswordResetEntity, string> {
  findByTokenHash(tokenHash: string): Promise<PasswordResetEntity | null>;
  findLatestActiveByUserId(userId: string): Promise<PasswordResetEntity | null>;
  markAsUsed(id: string): Promise<boolean>;
  invalidateAllPendingForUser(userId: string): Promise<number>;
  deleteExpiredTokens(): Promise<number>;
}
