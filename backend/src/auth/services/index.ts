/**
 * Central Auth Services Export & Service Locator Factory
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { repositories } from '../../repositories';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { PasswordResetService } from './password-reset.service';
import { AccountSecurityService } from './account-security.service';
import { AuthService } from './auth.service';

export * from './token.service';
export * from './password.service';
export * from './session.service';
export * from './password-reset.service';
export * from './account-security.service';
export * from './auth.service';

export interface AuthServicesContainer {
  tokenService: TokenService;
  passwordService: PasswordService;
  sessionService: SessionService;
  passwordResetService: PasswordResetService;
  accountSecurityService: AccountSecurityService;
  authService: AuthService;
}

export class AuthServiceFactory {
  private static instance: AuthServicesContainer | null = null;

  public static getServices(): AuthServicesContainer {
    if (!this.instance) {
      const tokenService = new TokenService(repositories.refreshTokenRepository);
      const passwordService = new PasswordService();
      const sessionService = new SessionService(repositories.sessionRepository);
      const passwordResetService = new PasswordResetService(
        repositories.passwordResetRepository,
        repositories.userRepository,
        passwordService
      );
      const accountSecurityService = new AccountSecurityService(repositories.loginAttemptRepository);

      const authService = new AuthService(
        repositories.userRepository,
        repositories.userPreferenceRepository,
        repositories.auditLogRepository,
        tokenService,
        passwordService,
        sessionService,
        passwordResetService,
        accountSecurityService
      );

      this.instance = {
        tokenService,
        passwordService,
        sessionService,
        passwordResetService,
        accountSecurityService,
        authService,
      };
    }

    return this.instance;
  }
}

export const authServices = AuthServiceFactory.getServices();
