/**
 * User Session Management Service
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { ISessionRepository } from '../../repositories/interfaces/ISessionRepository';
import { SessionEntity } from '../auth.types';
import { CryptoUtils } from '../../core/security/crypto.utils';
import { config } from '../../config';

export class SessionService {
  private readonly sessionRepo: ISessionRepository;

  constructor(sessionRepo: ISessionRepository) {
    this.sessionRepo = sessionRepo;
  }

  /**
   * Creates a new user session
   */
  public async createSession(userId: string, token: string, ipAddress?: string, userAgent?: string): Promise<SessionEntity> {
    const tokenHash = CryptoUtils.hashSha256(token);
    const expiresAt = new Date(Date.now() + config.security.token.refreshExpiresInSeconds * 1000);

    return this.sessionRepo.create({
      id: uuidv4(),
      userId,
      tokenHash,
      ipAddress,
      userAgent,
      deviceInfo: userAgent ? this.parseDeviceInfo(userAgent) : 'Unknown Device',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt,
    });
  }

  /**
   * Retrieves active sessions for a user
   */
  public async getActiveSessions(userId: string): Promise<SessionEntity[]> {
    return this.sessionRepo.findActiveByUserId(userId);
  }

  /**
   * Revokes a specific session
   */
  public async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || session.userId !== userId) {
      return false;
    }
    return this.sessionRepo.revokeSession(sessionId, 'Revoked by user');
  }

  /**
   * Revokes all active sessions for a user
   */
  public async revokeAllUserSessions(userId: string): Promise<number> {
    return this.sessionRepo.revokeAllUserSessions(userId, 'Logout all devices');
  }

  /**
   * Revokes all other sessions except current
   */
  public async revokeOtherUserSessions(userId: string, currentSessionId: string): Promise<number> {
    return this.sessionRepo.revokeOtherUserSessions(userId, currentSessionId, 'Revoked other sessions');
  }

  private parseDeviceInfo(ua: string): string {
    if (/mobile/i.test(ua)) return 'Mobile Browser';
    if (/tablet/i.test(ua)) return 'Tablet Browser';
    if (/windows/i.test(ua)) return 'Windows Desktop';
    if (/macintosh|mac os x/i.test(ua)) return 'macOS Desktop';
    if (/linux/i.test(ua)) return 'Linux Desktop';
    return 'Desktop Browser';
  }
}
