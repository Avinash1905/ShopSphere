/**
 * Password Management Service
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { PasswordUtils, PasswordStrengthResult } from '../../core/security/password.utils';
import { PasswordPolicyError } from '../../core/errors/DomainErrors';
import { config } from '../../config';

export class PasswordService {
  /**
   * Hashes a plain-text password using salt rounds from config
   */
  public async hashPassword(password: string): Promise<string> {
    return PasswordUtils.hashPassword(password, config.security.password.saltRounds);
  }

  /**
   * Verifies plain text password against hashed password
   */
  public async verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
    return PasswordUtils.verifyPassword(plainPassword, passwordHash);
  }

  /**
   * Enforces password policies and throws PasswordPolicyError on violation
   */
  public validatePasswordOrThrow(password: string, username?: string, email?: string): PasswordStrengthResult {
    const result = PasswordUtils.evaluateStrength(password, {
      username,
      email,
      policy: config.security.password,
    });

    if (!result.isValid) {
      throw new PasswordPolicyError(result.violations);
    }

    return result;
  }

  /**
   * Checks if candidate password is in an array of previously used hashes
   */
  public async isPasswordReused(candidatePassword: string, previousHashes: string[]): Promise<boolean> {
    for (const hash of previousHashes) {
      const match = await this.verifyPassword(candidatePassword, hash);
      if (match) return true;
    }
    return false;
  }
}
