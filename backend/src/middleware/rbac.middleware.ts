/**
 * Role-Based Access Control (RBAC) and Permission Enforcement Middleware
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { Role, Roles, Permission } from '../config/constants';
import { PermissionEvaluator } from '../auth/permissions';
import { AuthenticationError, AuthorizationError, InsufficientPermissionsError } from '../core/errors/DomainErrors';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required before role authorization.');
    }

    if (!PermissionEvaluator.hasRole(req.user.role, allowedRoles)) {
      throw new AuthorizationError(
        `Access denied. Your role '${req.user.role}' is not authorized to access this resource. Allowed roles: [${allowedRoles.join(', ')}]`
      );
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required before permission check.');
    }

    const hasAll = PermissionEvaluator.hasAllPermissions(req.user.permissions, requiredPermissions);
    if (!hasAll) {
      throw new InsufficientPermissionsError(requiredPermissions);
    }

    next();
  };
}

export function requireOwnershipOrAdmin(getOwnerId: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required.');
    }

    if (req.user.role === Roles.ADMIN) {
      return next();
    }

    const ownerId = getOwnerId(req);
    if (!ownerId || req.user.id !== ownerId) {
      throw new AuthorizationError('You do not have permission to access or modify this resource.');
    }

    next();
  };
}
