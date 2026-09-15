/**
 * User Preferences HTTP Controller
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { UserPreferenceService, userServices } from '../services';
import { ResponseBuilder } from '../../core/response/ApiResponse';
import { AuthenticationError } from '../../core/errors/DomainErrors';

export class UserPreferenceController {
  private readonly prefService: UserPreferenceService;

  constructor(prefService: UserPreferenceService = userServices.userPreferenceService) {
    this.prefService = prefService;
  }

  /**
   * GET /api/v1/users/me/preferences
   */
  public getPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const prefs = await this.prefService.getPreferences(req.user.id);
      ResponseBuilder.success(res, prefs);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/users/me/preferences
   */
  public updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const updated = await this.prefService.updatePreferences(req.user.id, req.body);
      ResponseBuilder.success(res, updated, 'Preferences updated successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/users/me/preferences/reset
   */
  public resetPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const defaults = await this.prefService.resetPreferences(req.user.id);
      ResponseBuilder.success(res, defaults, 'Preferences reset to defaults');
    } catch (err) {
      next(err);
    }
  };
}

export const userPreferenceController = new UserPreferenceController();
