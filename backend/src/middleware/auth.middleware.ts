/**
 * JWT Authentication Middleware
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { authServices } from '../auth/services';
import { AuthenticationError } from '../core/errors/DomainErrors';
import { RequestContext } from '../core/context/RequestContext';
import { AuthenticatedUserContext } from '../auth/auth.types';

export function authenticate(options: { optional?: boolean } = {}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      if (options.optional) {
        return next();
      }
      throw new AuthenticationError('Authentication required. Missing Bearer token or authorization header.');
    }

    try {
      const payload = authServices.tokenService.verifyAccessToken(token);

      const userContext: AuthenticatedUserContext = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        permissions: payload.permissions,
        status: payload.status,
        sessionId: payload.sessionId,
      };

      req.user = userContext;

      // Update RequestContext AsyncLocalStorage
      RequestContext.setUserId(userContext.id, userContext.email, [userContext.role], userContext.permissions);

      next();
    } catch (err) {
      if (options.optional) {
        return next();
      }
      throw err;
    }
  };
}
