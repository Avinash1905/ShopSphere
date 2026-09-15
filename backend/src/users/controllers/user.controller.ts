/**
 * User Profile & Account HTTP Controller
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { UserService, userServices } from '../services';
import { ResponseBuilder } from '../../core/response/ApiResponse';
import { AuthenticationError } from '../../core/errors/DomainErrors';
import { PaginationHelper } from '../../core/response/PaginationMeta';

export class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService = userServices.userService) {
    this.userService = userService;
  }

  /**
   * GET /api/v1/users/me
   */
  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const profile = await this.userService.getProfile(req.user.id);
      ResponseBuilder.success(res, profile);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/users/me
   */
  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const updated = await this.userService.updateProfile(req.user.id, req.body);
      ResponseBuilder.success(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/users/me/password
   */
  public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const { currentPassword, newPassword } = req.body;
      const sessionId = req.user.sessionId;

      await this.userService.changePassword(req.user.id, currentPassword, newPassword, sessionId);
      ResponseBuilder.success(res, { changed: true }, 'Password changed successfully. Other sessions revoked.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/users (Admin only)
   */
  public listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const role = req.query.role as any;
      const status = req.query.status as any;
      const search = req.query.search as string;
      const sortBy = (req.query.sortBy as any) || 'createdAt';
      const sortOrder = (req.query.sortOrder as any) || 'desc';

      const { users, total } = await this.userService.listUsers(
        { role, status, search },
        page,
        limit,
        sortBy,
        sortOrder
      );

      const paginationMeta = PaginationHelper.buildMeta(total, page, limit);
      ResponseBuilder.paginated(res, users, paginationMeta);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/users/:id (Admin only)
   */
  public getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getProfile(req.params.id);
      ResponseBuilder.success(res, user);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/users/:id/status (Admin only)
   */
  public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const targetId = req.params.id;
      const { status, reason } = req.body;

      const updated = await this.userService.updateUserStatus(targetId, status, req.user.id, reason);
      ResponseBuilder.success(res, updated, `User account status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
