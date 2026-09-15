/**
 * Core Authentication Orchestration Service
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { IUserPreferenceRepository, IAuditLogRepository } from '../../repositories/interfaces/IUserPreferenceRepository';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { PasswordResetService } from './password-reset.service';
import { AccountSecurityService } from './account-security.service';
import { PermissionEvaluator } from '../permissions';
import { UserEntity, UserProfileDTO, toUserProfileDTO } from '../../users/users.types';
import { AuthTokens, AuthTokenPayload } from '../auth.types';
import { Roles, AccountStatus, AuditAction, Role } from '../../config/constants';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  InvalidCredentialsError,
  AccountSuspendedError,
  AccountInactiveError,
  NotFoundError,
  RoleEscalationError,
  ConflictError,
} from '../../core/errors/DomainErrors';
import { eventBus } from '../../core/events/EventBus';
import { logger } from '../../core/logger/Logger';

export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  phoneNumber?: string;
}

export interface LoginDTO {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterResult {
  user: UserProfileDTO;
  tokens: AuthTokens;
}

export interface LoginResult {
  user: UserProfileDTO;
  tokens: AuthTokens;
  sessionId: string;
}

export class AuthService {
  private readonly userRepo: IUserRepository;
  private readonly preferenceRepo: IUserPreferenceRepository;
  private readonly auditLogRepo: IAuditLogRepository;
  private readonly tokenService: TokenService;
  private readonly passwordService: PasswordService;
  private readonly sessionService: SessionService;
  private readonly passwordResetService: PasswordResetService;
  private readonly accountSecurityService: AccountSecurityService;

  constructor(
    userRepo: IUserRepository,
    preferenceRepo: IUserPreferenceRepository,
    auditLogRepo: IAuditLogRepository,
    tokenService: TokenService,
    passwordService: PasswordService,
    sessionService: SessionService,
    passwordResetService: PasswordResetService,
    accountSecurityService: AccountSecurityService
  ) {
    this.userRepo = userRepo;
    this.preferenceRepo = preferenceRepo;
    this.auditLogRepo = auditLogRepo;
    this.tokenService = tokenService;
    this.passwordService = passwordService;
    this.sessionService = sessionService;
    this.passwordResetService = passwordResetService;
    this.accountSecurityService = accountSecurityService;
  }

  /**
   * User Registration with Role Assignment Safeguards and Unique Constraints
   */
  public async register(dto: RegisterDTO, ipAddress?: string, userAgent?: string): Promise<RegisterResult> {
    const cleanEmail = dto.email.toLowerCase().trim();
    const cleanUsername = dto.username.toLowerCase().trim();

    // 1. Prevent privilege escalation (never allow self-registering as ADMIN)
    if (dto.role === Roles.ADMIN) {
      throw new RoleEscalationError('Self-assigning the ADMIN role during public registration is strictly prohibited.');
    }

    const assignedRole: Role = dto.role === Roles.SELLER ? Roles.SELLER : Roles.CUSTOMER;

    // 2. Uniqueness checks
    if (await this.userRepo.existsByEmail(cleanEmail)) {
      throw new EmailAlreadyExistsError(cleanEmail);
    }

    if (await this.userRepo.existsByUsername(cleanUsername)) {
      throw new UsernameAlreadyExistsError(cleanUsername);
    }

    // 3. Password policy validation
    this.passwordService.validatePasswordOrThrow(dto.password, cleanUsername, cleanEmail);

    // 4. Hash password
    const passwordHash = await this.passwordService.hashPassword(dto.password);

    // 5. Create user entity
    const now = new Date();
    const newUser: UserEntity = {
      id: uuidv4(),
      email: cleanEmail,
      username: cleanUsername,
      passwordHash,
      role: assignedRole,
      status: AccountStatus.ACTIVE,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phoneNumber: dto.phoneNumber?.trim(),
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    const savedUser = await this.userRepo.create(newUser);

    // 6. Initialize default user preferences
    await this.preferenceRepo.resetToDefaults(savedUser.id);

    // 7. Issue initial authentication tokens
    const permissions = PermissionEvaluator.getPermissionsForRole(savedUser.role);
    const tokenPayload: Omit<AuthTokenPayload, 'iat' | 'exp' | 'jti' | 'iss' | 'aud'> = {
      sub: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
      role: savedUser.role,
      permissions,
      status: savedUser.status,
    };

    const tokens = await this.tokenService.issueAuthTokens(tokenPayload, ipAddress, userAgent);

    // 8. Create session
    await this.sessionService.createSession(savedUser.id, tokens.refreshToken, ipAddress, userAgent);

    // 9. Record audit log & publish event
    await this.auditLogRepo.record(AuditAction.USER_REGISTER, { email: savedUser.email, role: savedUser.role }, savedUser.id, undefined, ipAddress, userAgent);

    await eventBus.publish('user.registered', {
      userId: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
      role: savedUser.role,
      status: savedUser.status,
    });

    logger.info(`User registered successfully: '${savedUser.id}' (${savedUser.email}) with role [${savedUser.role}]`);

    return {
      user: toUserProfileDTO(savedUser),
      tokens,
    };
  }

  /**
   * User Login with Lockout Checks and Account Status Verification
   */
  public async login(dto: LoginDTO, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    const identifier = dto.emailOrUsername.toLowerCase().trim();

    // 1. Check brute-force lockout status
    await this.accountSecurityService.assertNotLocked(identifier);

    // 2. Find user by email or username
    const user = await this.userRepo.findByEmailOrUsername(identifier);
    if (!user) {
      await this.accountSecurityService.recordFailedAttempt(identifier, ipAddress, userAgent, 'User not found');
      throw new InvalidCredentialsError();
    }

    // 3. Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.accountSecurityService.recordFailedAttempt(user.email, ipAddress, userAgent, 'Incorrect password');
      throw new InvalidCredentialsError();
    }

    // 4. Verify account status
    if (user.status === AccountStatus.SUSPENDED) {
      throw new AccountSuspendedError();
    }

    if (user.status === AccountStatus.INACTIVE) {
      throw new AccountInactiveError();
    }

    // 5. Clear failed login attempts upon successful verification
    await this.accountSecurityService.recordSuccessfulAttempt(user.email, ipAddress, userAgent);

    // 6. Issue auth tokens
    const permissions = PermissionEvaluator.getPermissionsForRole(user.role);
    const tokenPayload: Omit<AuthTokenPayload, 'iat' | 'exp' | 'jti' | 'iss' | 'aud'> = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions,
      status: user.status,
    };

    const tokens = await this.tokenService.issueAuthTokens(tokenPayload, ipAddress, userAgent);

    // 7. Track session
    const session = await this.sessionService.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    // 8. Update last login
    await this.userRepo.updateLastLogin(user.id, new Date());

    // 9. Audit and event
    await this.auditLogRepo.record(AuditAction.USER_LOGIN_SUCCESS, { sessionId: session.id }, user.id, undefined, ipAddress, userAgent);

    await eventBus.publish('user.logged_in', {
      userId: user.id,
      sessionId: session.id,
      ipAddress,
      userAgent,
      loginTime: new Date().toISOString(),
    });

    logger.info(`User logged in: '${user.id}' (${user.email})`);

    return {
      user: toUserProfileDTO(user),
      tokens,
      sessionId: session.id,
    };
  }

  /**
   * Token Refresh with Refresh Token Rotation
   */
  public async refreshToken(rawRefreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    // 1. Rotate refresh token (will throw TokenReusedBreachError if stolen)
    const { newRawRefreshToken, userId } = await this.tokenService.rotateRefreshToken(rawRefreshToken, ipAddress, userAgent);

    // 2. Ensure user still exists and is active
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User associated with token no longer exists.');
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new AccountSuspendedError();
    }

    // 3. Issue new access token
    const permissions = PermissionEvaluator.getPermissionsForRole(user.role);
    const tokenPayload: Omit<AuthTokenPayload, 'iat' | 'exp' | 'jti' | 'iss' | 'aud'> = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions,
      status: user.status,
    };

    const accessToken = this.tokenService.generateAccessToken(tokenPayload);

    await this.auditLogRepo.record(AuditAction.USER_TOKEN_REFRESH, undefined, user.id, undefined, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      refreshTokenExpiresInSeconds: 604800,
    };
  }

  /**
   * User Logout (Invalidate current session and refresh token)
   */
  public async logout(rawRefreshToken?: string, sessionId?: string, userId?: string): Promise<boolean> {
    if (rawRefreshToken) {
      await this.tokenService.revokeRefreshToken(rawRefreshToken);
    }

    if (sessionId && userId) {
      await this.sessionService.revokeSession(sessionId, userId);
    }

    if (userId) {
      await this.auditLogRepo.record(AuditAction.USER_LOGOUT, { sessionId }, userId);
    }

    return true;
  }

  /**
   * Logout from all devices
   */
  public async logoutAll(userId: string): Promise<number> {
    const revokedCount = await this.sessionService.revokeAllUserSessions(userId);
    await this.auditLogRepo.record(AuditAction.USER_LOGOUT_ALL, { revokedSessionsCount: revokedCount }, userId);
    return revokedCount;
  }

  /**
   * Retrieve current user profile
   */
  public async getMe(userId: string): Promise<UserProfileDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return toUserProfileDTO(user);
  }

  public getPasswordResetService(): PasswordResetService {
    return this.passwordResetService;
  }

  public getSessionService(): SessionService {
    return this.sessionService;
  }
}
