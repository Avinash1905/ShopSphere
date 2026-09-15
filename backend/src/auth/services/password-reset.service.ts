/**
 * Local Password Reset Workflow Service (100% Standalone - NO External API Keys)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { IPasswordResetRepository } from '../../repositories/interfaces/IPasswordResetRepository';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { CryptoUtils } from '../../core/security/crypto.utils';
import { PasswordService } from './password.service';
import { PasswordResetTokenExpiredError, PasswordResetTokenInvalidError, NotFoundError } from '../../core/errors/DomainErrors';
import { config } from '../../config';
import { eventBus } from '../../core/events/EventBus';
import { logger } from '../../core/logger/Logger';

export interface LocalResetNotification {
  id: string;
  userId: string;
  email: string;
  resetToken: string;
  resetUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

export class PasswordResetService {
  private readonly resetRepo: IPasswordResetRepository;
  private readonly userRepo: IUserRepository;
  private readonly passwordService: PasswordService;

  // Local notification queue for testing/inspection without any external email API keys
  private readonly localNotifications: LocalResetNotification[] = [];

  constructor(resetRepo: IPasswordResetRepository, userRepo: IUserRepository, passwordService: PasswordService) {
    this.resetRepo = resetRepo;
    this.userRepo = userRepo;
    this.passwordService = passwordService;
  }

  /**
   * Generates a single-use secure reset token and stores its SHA-256 hash
   */
  public async requestPasswordReset(email: string, ipAddress?: string): Promise<{ success: boolean; message: string; localTokenForDev?: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Security best practice: Prevent account enumeration by returning generic response
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been dispatched.',
      };
    }

    // Invalidate any previous pending reset tokens for this user
    await this.resetRepo.invalidateAllPendingForUser(user.id);

    // Generate secure 32-byte (64 hex characters) token
    const rawToken = CryptoUtils.generateSecureToken(32);
    const tokenHash = CryptoUtils.hashSha256(rawToken);

    const expiresAt = new Date(Date.now() + config.security.token.resetTokenExpiresMinutes * 60 * 1000);

    await this.resetRepo.create({
      id: uuidv4(),
      userId: user.id,
      email: user.email,
      tokenHash,
      expiresAt,
      isUsed: false,
      ipAddress,
      createdAt: new Date(),
    });

    const resetUrl = `http://localhost:3000/auth/reset-password?token=${rawToken}`;

    // Store in local notification queue (100% self-contained locally)
    const notification: LocalResetNotification = {
      id: uuidv4(),
      userId: user.id,
      email: user.email,
      resetToken: rawToken,
      resetUrl,
      expiresAt,
      createdAt: new Date(),
    };
    this.localNotifications.unshift(notification);
    if (this.localNotifications.length > 50) {
      this.localNotifications.pop();
    }

    logger.info(`Password reset link generated for user '${user.id}' (expires in ${config.security.token.resetTokenExpiresMinutes}m)`);

    await eventBus.publish('user.password_reset_requested', {
      userId: user.id,
      email: user.email,
      resetToken: rawToken,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been dispatched.',
      // Only include local dev token if in development or test environment
      localTokenForDev: config.isProduction ? undefined : rawToken,
    };
  }

  /**
   * Verifies the reset token and resets user password
   */
  public async resetPassword(rawToken: string, newPassword: string): Promise<boolean> {
    const tokenHash = CryptoUtils.hashSha256(rawToken);
    const resetRecord = await this.resetRepo.findByTokenHash(tokenHash);

    if (!resetRecord) {
      throw new PasswordResetTokenInvalidError('Invalid password reset token.');
    }

    if (resetRecord.isUsed) {
      throw new PasswordResetTokenInvalidError('This password reset token has already been used.');
    }

    if (resetRecord.expiresAt <= new Date()) {
      throw new PasswordResetTokenExpiredError('Password reset token has expired. Please request a new one.');
    }

    const user = await this.userRepo.findById(resetRecord.userId);
    if (!user) {
      throw new NotFoundError('User associated with reset token was not found.');
    }

    // Validate new password policy
    this.passwordService.validatePasswordOrThrow(newPassword, user.username, user.email);

    // Hash and update password
    const newHash = await this.passwordService.hashPassword(newPassword);
    await this.userRepo.updatePassword(user.id, newHash);

    // Invalidate the reset token (single-use)
    await this.resetRepo.markAsUsed(resetRecord.id);

    logger.info(`Password successfully reset for user '${user.id}'`);

    await eventBus.publish('user.password_reset_completed', {
      userId: user.id,
      completedAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Helper for local inspection/testing of dispatched password reset notifications
   */
  public getLatestLocalNotification(email?: string): LocalResetNotification | undefined {
    if (email) {
      return this.localNotifications.find((n) => n.email.toLowerCase() === email.toLowerCase());
    }
    return this.localNotifications[0];
  }

  public clearLocalNotifications(): void {
    this.localNotifications.length = 0;
  }
}
