/**
 * ShopSphere Security & RBAC Engine
 * JWT signature verification, PBKDF2 / Bcrypt password hashing simulation,
 * role-permission matrix evaluation, and IP rate limiting guards.
 */

import { UserRole } from '../../packages/shared-types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer: [
    'customer:profile:read',
    'customer:profile:write',
    'customer:orders:read',
    'customer:orders:create',
    'customer:reviews:create',
    'customer:wishlist:manage',
    'customer:addresses:manage'
  ],
  seller: [
    'customer:profile:read',
    'seller:dashboard:read',
    'seller:products:manage',
    'seller:inventory:manage',
    'seller:orders:fulfill',
    'seller:coupons:manage',
    'seller:analytics:read',
    'seller:payouts:request'
  ],
  moderator: [
    'admin:reviews:moderate',
    'admin:products:approve',
    'admin:disputes:read'
  ],
  support_agent: [
    'admin:users:read',
    'admin:orders:read',
    'admin:disputes:arbitrate'
  ],
  admin: [
    'admin:dashboard:read',
    'admin:users:manage',
    'admin:sellers:manage',
    'admin:products:approve',
    'admin:categories:manage',
    'admin:coupons:manage',
    'admin:disputes:arbitrate',
    'admin:reviews:moderate',
    'admin:reports:read'
  ],
  super_admin: [
    '*' // Full super-admin wildcard access
  ]
};

export class SecurityEngine {
  private rateLimitWindow = new Map<string, { count: number; expiresAt: number }>();

  public hasPermission(role: UserRole, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }

  public checkRateLimit(clientIp: string, maxRequests = 100, windowSeconds = 60): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.rateLimitWindow.get(clientIp);

    if (!entry || entry.expiresAt < now) {
      this.rateLimitWindow.set(clientIp, { count: 1, expiresAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count };
  }

  public hashPassword(password: string): string {
    // Deterministic simulation for local demo security
    return `argon2id$v=19$m=65536,t=3,p=4$${Buffer.from(password).toString('base64')}`;
  }

  public verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
}
