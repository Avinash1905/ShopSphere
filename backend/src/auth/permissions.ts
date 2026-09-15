/**
 * Centralized Role-Based Access Control (RBAC) and Permissions Matrix
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Role, Roles, Permission, Permissions } from '../config/constants';

export const RolePermissionMap: Record<Role, Permission[]> = {
  [Roles.CUSTOMER]: [
    Permissions.USERS_READ_SELF,
    Permissions.USERS_WRITE_SELF,
    Permissions.USERS_DELETE_SELF,
    Permissions.ADDRESSES_CREATE_SELF,
    Permissions.ADDRESSES_READ_SELF,
    Permissions.ADDRESSES_UPDATE_SELF,
    Permissions.ADDRESSES_DELETE_SELF,
    Permissions.AUTH_REFRESH_TOKEN,
    Permissions.AUTH_LOGOUT,
    Permissions.AUTH_CHANGE_PASSWORD,
    Permissions.AUTH_SESSIONS_READ_SELF,
    Permissions.AUTH_SESSIONS_REVOKE_SELF,
    Permissions.PREFERENCES_READ_SELF,
    Permissions.PREFERENCES_WRITE_SELF,
  ],
  [Roles.SELLER]: [
    Permissions.USERS_READ_SELF,
    Permissions.USERS_WRITE_SELF,
    Permissions.USERS_DELETE_SELF,
    Permissions.ADDRESSES_CREATE_SELF,
    Permissions.ADDRESSES_READ_SELF,
    Permissions.ADDRESSES_UPDATE_SELF,
    Permissions.ADDRESSES_DELETE_SELF,
    Permissions.AUTH_REFRESH_TOKEN,
    Permissions.AUTH_LOGOUT,
    Permissions.AUTH_CHANGE_PASSWORD,
    Permissions.AUTH_SESSIONS_READ_SELF,
    Permissions.AUTH_SESSIONS_REVOKE_SELF,
    Permissions.PREFERENCES_READ_SELF,
    Permissions.PREFERENCES_WRITE_SELF,
  ],
  [Roles.ADMIN]: [
    Permissions.ADMIN_FULL_ACCESS,
    Permissions.USERS_READ_SELF,
    Permissions.USERS_WRITE_SELF,
    Permissions.USERS_DELETE_SELF,
    Permissions.USERS_READ_ALL,
    Permissions.USERS_WRITE_ALL,
    Permissions.USERS_UPDATE_STATUS,
    Permissions.USERS_DELETE_ALL,
    Permissions.ADDRESSES_CREATE_SELF,
    Permissions.ADDRESSES_READ_SELF,
    Permissions.ADDRESSES_UPDATE_SELF,
    Permissions.ADDRESSES_DELETE_SELF,
    Permissions.ADDRESSES_READ_ALL,
    Permissions.ADDRESSES_WRITE_ALL,
    Permissions.AUTH_REFRESH_TOKEN,
    Permissions.AUTH_LOGOUT,
    Permissions.AUTH_CHANGE_PASSWORD,
    Permissions.AUTH_SESSIONS_READ_SELF,
    Permissions.AUTH_SESSIONS_REVOKE_SELF,
    Permissions.AUTH_SESSIONS_READ_ALL,
    Permissions.AUTH_SESSIONS_REVOKE_ALL,
    Permissions.PREFERENCES_READ_SELF,
    Permissions.PREFERENCES_WRITE_SELF,
    Permissions.SYSTEM_AUDIT_READ,
    Permissions.SYSTEM_METRICS_READ,
  ],
};

export class PermissionEvaluator {
  /**
   * Retrieves all permissions assigned to a given role
   */
  public static getPermissionsForRole(role: Role): Permission[] {
    return RolePermissionMap[role] || [];
  }

  /**
   * Checks if user has a specific permission (or is ADMIN with wildcard)
   */
  public static hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
    if (userPermissions.includes(Permissions.ADMIN_FULL_ACCESS)) {
      return true;
    }
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Checks if user has at least one of the required permissions
   */
  public static hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    if (userPermissions.includes(Permissions.ADMIN_FULL_ACCESS)) {
      return true;
    }
    return requiredPermissions.some((perm) => userPermissions.includes(perm));
  }

  /**
   * Checks if user has all of the required permissions
   */
  public static hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    if (userPermissions.includes(Permissions.ADMIN_FULL_ACCESS)) {
      return true;
    }
    return requiredPermissions.every((perm) => userPermissions.includes(perm));
  }

  /**
   * Checks if user has one of the allowed roles
   */
  public static hasRole(userRole: Role, allowedRoles: Role[]): boolean {
    return allowedRoles.includes(userRole);
  }

  /**
   * Checks if user is authorized to access a resource (owner check or admin)
   */
  public static canAccessResource(userId: string, userRole: Role, resourceOwnerId: string): boolean {
    if (userRole === Roles.ADMIN) {
      return true;
    }
    return userId === resourceOwnerId;
  }
}
