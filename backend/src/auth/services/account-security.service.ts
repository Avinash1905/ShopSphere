/**
 * Account Security & Brute-Force Abuse Protection Service
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { ILoginAttemptRepository } from '../../repositories/interfaces/IUserPreferenceRepository';
import { LockoutInfo } from '../auth.types';
import { AccountLockedError } from '../../core/errors/DomainErrors';
import { config } from '../../config';
import { eventBus } from '../../core/events/EventBus';
import { logger } from '../../core/logger/Logger';

export class AccountSecurityService {
  private readonly loginAttemptRepo: ILoginAttemptRepository;

  constructor(loginAttemptRepo: ILoginAttemptRepository) {
    this.loginAttemptRepo = loginAttemptRepo;
  }

  /**
   * Asserts whether an account is currently locked out; throws AccountLockedError if locked
   */
  public async assertNotLocked(email: string): Promise<void> {
    const lockInfo = await this.getLockoutStatus(email);
    if (lockInfo.isLocked && lockInfo.unlockAt) {
      throw new AccountLockedError(
        `Account is temporarily locked due to excessive failed attempts. Please try again after ${lockInfo.lockoutRemainingSeconds} seconds.`,
        lockInfo.unlockAt
      );
    }
  }

  /**
   * Returns current lockout and attempt status for an email
   */
  public async getLockoutStatus(email: string): Promise<LockoutInfo> {
    const unlockAt = await this.loginAttemptRepo.getLockoutExpiry(email);
    const now = new Date();

    if (unlockAt && unlockAt > now) {
      const remainingSeconds = Math.ceil((unlockAt.getTime() - now.getTime()) / 1000);
      return {
        isLocked: true,
        failedAttempts: config.security.lockout.maxAttempts,
        remainingAttempts: 0,
        unlockAt,
        lockoutRemainingSeconds: remainingSeconds,
      };
    }

    // Check failed attempts in reset window
    const windowStart = new Date(Date.now() - config.security.lockout.resetWindowMinutes * 60 * 1000);
    const failedAttempts = await this.loginAttemptRepo.getFailedAttemptsCount(email, windowStart);
    const remainingAttempts = Math.max(0, config.security.lockout.maxAttempts - failedAttempts);

    return {
      isLocked: false,
      failedAttempts,
      remainingAttempts,
    };
  }

  /**
   * Records a failed login attempt and locks account if threshold exceeded
   */
  public async recordFailedAttempt(email: string, ipAddress?: string, userAgent?: string, reason = 'Invalid credentials'): Promise<LockoutInfo> {
    await this.loginAttemptRepo.recordAttempt(email, false, ipAddress, userAgent, reason);

    const windowStart = new Date(Date.now() - config.security.lockout.resetWindowMinutes * 60 * 1000);
    const failedAttempts = await this.loginAttemptRepo.getFailedAttemptsCount(email, windowStart);

    if (failedAttempts >= config.security.lockout.maxAttempts) {
      const unlockAt = new Date(Date.now() + config.security.lockout.lockoutDurationMinutes * 60 * 1000);
      await this.loginAttemptRepo.lockAccountUntil(email, unlockAt);

      logger.warn(`Account locked due to brute force attempts: '${email}' until ${unlockAt.toISOString()}`);

      await eventBus.publish('user.login_failed', {
        email,
        ipAddress,
        userAgent,
        attemptCount: failedAttempts,
        locked: true,
        lockoutExpiresAt: unlockAt.toISOString(),
      });

      const remainingSeconds = Math.ceil((unlockAt.getTime() - Date.now()) / 1000);

      return {
        isLocked: true,
        failedAttempts,
        remainingAttempts: 0,
        unlockAt,
        lockoutRemainingSeconds: remainingSeconds,
      };
    }

    const remainingAttempts = config.security.lockout.maxAttempts - failedAttempts;

    await eventBus.publish('user.login_failed', {
      email,
      ipAddress,
      userAgent,
      attemptCount: failedAttempts,
      locked: false,
    });

    return {
      isLocked: false,
      failedAttempts,
      remainingAttempts,
    };
  }

  /**
   * Clears failed attempts upon successful authentication
   */
  public async recordSuccessfulAttempt(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.loginAttemptRepo.recordAttempt(email, true, ipAddress, userAgent);
    await this.loginAttemptRepo.clearFailedAttempts(email);
  }
}
