/**
 * User Profile & Account Management Service
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IUserRepository, UserSearchCriteria } from '../../repositories/interfaces/IUserRepository';
import { ISessionRepository } from '../../repositories/interfaces/ISessionRepository';
import { IAuditLogRepository } from '../../repositories/interfaces/IUserPreferenceRepository';
import { PasswordService } from '../../auth/services/password.service';
import { UserEntity, UserProfileDTO, toUserProfileDTO } from '../users.types';
import { AccountStatus, AccountStatusType, AuditAction, Roles } from '../../config/constants';
import {
  NotFoundError,
  InvalidCredentialsError,
  BusinessRuleError,
  AuthorizationError,
} from '../../core/errors/DomainErrors';
import { eventBus } from '../../core/events/EventBus';
import { logger } from '../../core/logger/Logger';

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
}

export class UserService {
  private readonly userRepo: IUserRepository;
  private readonly sessionRepo: ISessionRepository;
  private readonly auditLogRepo: IAuditLogRepository;
  private readonly passwordService: PasswordService;

  constructor(
    userRepo: IUserRepository,
    sessionRepo: ISessionRepository,
    auditLogRepo: IAuditLogRepository,
    passwordService: PasswordService
  ) {
    this.userRepo = userRepo;
    this.sessionRepo = sessionRepo;
    this.auditLogRepo = auditLogRepo;
    this.passwordService = passwordService;
  }

  /**
   * Retrieves profile of a user by their ID
   */
  public async getProfile(userId: string): Promise<UserProfileDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return toUserProfileDTO(user);
  }

  /**
   * Updates user profile fields
   */
  public async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<UserProfileDTO> {
    const existing = await this.userRepo.findById(userId);
    if (!existing) {
      throw new NotFoundError('User', userId);
    }

    const updated = await this.userRepo.update(userId, {
      ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
      ...(dto.phoneNumber !== undefined ? { phoneNumber: dto.phoneNumber.trim() } : {}),
      ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl.trim() } : {}),
      ...(dto.bio !== undefined ? { bio: dto.bio.trim() } : {}),
      ...(dto.dateOfBirth !== undefined ? { dateOfBirth: dto.dateOfBirth } : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
    });

    if (!updated) {
      throw new NotFoundError('User', userId);
    }

    await this.auditLogRepo.record(AuditAction.USER_PROFILE_UPDATE, { updatedFields: Object.keys(dto) }, userId);

    logger.info(`Profile updated for user '${userId}'`);
    return toUserProfileDTO(updated);
  }

  /**
   * Authenticated user password change with current password verification & session revocation
   */
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionId?: string
  ): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Verify current password
    const isCurrentValid = await this.passwordService.verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new InvalidCredentialsError('Current password provided is incorrect.');
    }

    // Validate new password rules
    this.passwordService.validatePasswordOrThrow(newPassword, user.username, user.email);

    // Hash and update
    const newHash = await this.passwordService.hashPassword(newPassword);
    await this.userRepo.updatePassword(userId, newHash);

    // Security best practice: Revoke other active sessions upon password change
    let revokedCount = 0;
    if (currentSessionId) {
      revokedCount = await this.sessionRepo.revokeOtherUserSessions(userId, currentSessionId, 'Password changed');
    }

    await this.auditLogRepo.record(AuditAction.USER_PASSWORD_CHANGE, { otherSessionsRevoked: revokedCount }, userId);

    await eventBus.publish('user.password_changed', {
      userId,
      changedAt: new Date().toISOString(),
      sessionsRevokedCount: revokedCount,
    });

    logger.info(`Password changed for user '${userId}', revoked ${revokedCount} other sessions`);
    return true;
  }

  /**
   * Admin user status update (ACTIVE, INACTIVE, SUSPENDED)
   */
  public async updateUserStatus(
    targetUserId: string,
    newStatus: AccountStatusType,
    adminUserId: string,
    reason?: string
  ): Promise<UserProfileDTO> {
    const target = await this.userRepo.findById(targetUserId);
    if (!target) {
      throw new NotFoundError('User', targetUserId);
    }

    if (target.id === adminUserId && newStatus !== AccountStatus.ACTIVE) {
      throw new BusinessRuleError('Admins cannot suspend or deactivate their own account.');
    }

    const oldStatus = target.status;
    const updated = await this.userRepo.updateStatus(targetUserId, newStatus);
    if (!updated) {
      throw new NotFoundError('User', targetUserId);
    }

    // If suspended, terminate all sessions
    if (newStatus === AccountStatus.SUSPENDED) {
      await this.sessionRepo.revokeAllUserSessions(targetUserId, `Account suspended by admin: ${reason || 'No reason'}`);
    }

    await this.auditLogRepo.record(
      AuditAction.USER_STATUS_UPDATE,
      { oldStatus, newStatus, reason, adminUserId },
      targetUserId
    );

    await eventBus.publish('user.status_changed', {
      userId: targetUserId,
      oldStatus,
      newStatus,
      updatedBy: adminUserId,
      reason,
    });

    logger.info(`User status updated: '${targetUserId}' -> ${newStatus} by admin '${adminUserId}'`);
    return toUserProfileDTO(updated);
  }

  /**
   * Search and list users with pagination (Admin only)
   */
  public async listUsers(
    criteria: UserSearchCriteria,
    page = 1,
    limit = 20,
    sortBy: keyof UserEntity = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ users: UserProfileDTO[]; total: number }> {
    const skip = (page - 1) * limit;
    const { users, total } = await this.userRepo.searchUsers(criteria, skip, limit, sortBy, sortOrder);

    return {
      users: users.map(toUserProfileDTO),
      total,
    };
  }

  /**
   * Delete user account (Admin or self with safeguards)
   */
  public async deleteUser(targetUserId: string, requestingUserId: string, isAdmin: boolean): Promise<boolean> {
    if (!isAdmin && targetUserId !== requestingUserId) {
      throw new AuthorizationError('You are not authorized to delete this account.');
    }

    const user = await this.userRepo.findById(targetUserId);
    if (!user) {
      throw new NotFoundError('User', targetUserId);
    }

    // Revoke all sessions first
    await this.sessionRepo.revokeAllUserSessions(targetUserId, 'Account deleted');
    const deleted = await this.userRepo.delete(targetUserId);

    logger.info(`User deleted: '${targetUserId}' by '${requestingUserId}'`);
    return deleted;
  }
}
