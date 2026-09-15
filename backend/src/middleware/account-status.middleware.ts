/**
 * Account Status Validation Middleware
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { AccountStatus } from '../config/constants';
import { AuthenticationError, AccountSuspendedError, AccountInactiveError } from '../core/errors/DomainErrors';
import { repositories } from '../repositories';

export async function requireActiveAccount(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required to verify account status.');
    }

    // Check live account status from repository to enforce real-time suspensions/deactivations
    const liveUser = await repositories.userRepository.findById(req.user.id);
    const currentStatus = liveUser ? liveUser.status : req.user.status;

    if (currentStatus === AccountStatus.SUSPENDED) {
      throw new AccountSuspendedError();
    }

    if (currentStatus === AccountStatus.INACTIVE) {
      throw new AccountInactiveError();
    }

    // Update in-flight user context with live status
    req.user.status = currentStatus;

    next();
  } catch (error) {
    next(error);
  }
}
