/**
 * Session Repository Interface (Member 3 Clean Architecture Boundary)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IBaseRepository } from './IBaseRepository';
import { SessionEntity } from '../../auth/auth.types';

export interface ISessionRepository extends IBaseRepository<SessionEntity, string> {
  findByTokenHash(tokenHash: string): Promise<SessionEntity | null>;
  findActiveByUserId(userId: string): Promise<SessionEntity[]>;
  revokeSession(sessionId: string, reason?: string): Promise<boolean>;
  revokeAllUserSessions(userId: string, reason?: string): Promise<number>;
  revokeOtherUserSessions(userId: string, currentSessionId: string, reason?: string): Promise<number>;
  deleteExpiredSessions(): Promise<number>;
  countActiveByUserId(userId: string): Promise<number>;
}
