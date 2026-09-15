/**
 * Refresh Token Repository Interface (Member 3 Clean Architecture Boundary)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IBaseRepository } from './IBaseRepository';
import { RefreshTokenEntity } from '../../auth/auth.types';

export interface IRefreshTokenRepository extends IBaseRepository<RefreshTokenEntity, string> {
  findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  findLatestActiveByUserId(userId: string): Promise<RefreshTokenEntity | null>;
  revokeToken(tokenHash: string, replacedByTokenHash?: string): Promise<boolean>;
  revokeTokenFamily(familyId: string): Promise<number>;
  revokeAllForUser(userId: string): Promise<number>;
  deleteExpiredTokens(): Promise<number>;
}
