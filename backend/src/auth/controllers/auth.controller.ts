/**
 * Authentication HTTP Endpoints Controller
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthServicesContainer, authServices } from '../services';
import { ResponseBuilder } from '../../core/response/ApiResponse';
import { HttpStatus } from '../../config/constants';
import { AuthenticationError } from '../../core/errors/DomainErrors';
import { config } from '../../config';

export class AuthController {
  private readonly services: AuthServicesContainer;

  constructor(services: AuthServicesContainer = authServices) {
    this.services = services;
  }

  /**
   * POST /api/v1/auth/register
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.services.authService.register(req.body, clientIp, userAgent);

      this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      ResponseBuilder.created(res, result, 'User registered successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/login
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.services.authService.login(req.body, clientIp, userAgent);

      this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      ResponseBuilder.success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/logout
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.refresh_token;
      const sessionId = req.user?.sessionId;
      const userId = req.user?.id;

      await this.services.authService.logout(refreshToken, sessionId, userId);

      this.clearAuthCookies(res);

      ResponseBuilder.success(res, { loggedOut: true }, 'Successfully logged out');
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/logout-all
   */
  public logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const revokedCount = await this.services.authService.logoutAll(req.user.id);
      this.clearAuthCookies(res);

      ResponseBuilder.success(res, { revokedSessionsCount: revokedCount }, 'Successfully logged out from all devices');
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/refresh
   */
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.refresh_token;
      if (!refreshToken) {
        throw new AuthenticationError('Refresh token is required in body or cookie');
      }

      const clientIp = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const newTokens = await this.services.authService.refreshToken(refreshToken, clientIp, userAgent);

      this.setAuthCookies(res, newTokens.accessToken, newTokens.refreshToken);

      ResponseBuilder.success(res, newTokens, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/forgot-password
   */
  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress;
      const result = await this.services.passwordResetService.requestPasswordReset(req.body.email, clientIp);

      ResponseBuilder.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/reset-password
   */
  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      await this.services.passwordResetService.resetPassword(token, newPassword);

      ResponseBuilder.success(res, { reset: true }, 'Password has been reset successfully. Please log in with your new password.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/auth/me
   */
  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const profile = await this.services.authService.getMe(req.user.id);
      ResponseBuilder.success(res, profile);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/auth/sessions
   */
  public getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const sessions = await this.services.sessionService.getActiveSessions(req.user.id);
      const safeSessions = sessions.map((s) => ({
        id: s.id,
        deviceInfo: s.deviceInfo,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === req.user?.sessionId,
      }));

      ResponseBuilder.success(res, safeSessions);
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/auth/sessions/:id
   */
  public revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const sessionId = req.params.id;
      const success = await this.services.sessionService.revokeSession(sessionId, req.user.id);

      ResponseBuilder.success(res, { revoked: success }, success ? 'Session revoked' : 'Session not found');
    } catch (err) {
      next(err);
    }
  };

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProd = config.isProduction;

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: config.security.token.accessExpiresInSeconds * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth/refresh',
      maxAge: config.security.token.refreshExpiresInSeconds * 1000,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
  }
}

export const authController = new AuthController();
