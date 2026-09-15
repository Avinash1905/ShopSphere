export interface AuthSubject {
  userId: string;
  roles: string[];
  permissions: string[];
  sellerId?: string;
  isSuperAdmin?: boolean;
}

export interface AuthResource {
  type: string; // 'products', 'orders', 'sellers', 'users', 'analytics', 'audit'
  id?: string;
  ownerId?: string;
  sellerId?: string;
  attributes?: Record<string, any>;
}

export interface AuthContext {
  ipAddress?: string;
  timestamp?: string;
  environment?: 'production' | 'staging' | 'test';
}

export interface PolicyRule {
  name: string;
  effect: 'ALLOW' | 'DENY';
  resourceType: string;
  actions: string[];
  condition?: (subject: AuthSubject, resource: AuthResource, context: AuthContext) => boolean;
}

export class AccessControlEngine {
  private customPolicies: PolicyRule[] = [];

  constructor() {
    this.registerDefaultPolicies();
  }

  public registerPolicy(rule: PolicyRule): void {
    this.customPolicies.push(rule);
  }

  public isAuthorized(
    subject: AuthSubject,
    action: string,
    resource: AuthResource,
    context: AuthContext = {}
  ): { allowed: boolean; reason?: string } {
    // 1. SuperAdmin Root Override
    if (subject.isSuperAdmin || subject.roles.includes('SUPER_ADMIN') || subject.permissions.includes('*:root')) {
      return { allowed: true, reason: 'SuperAdmin root access granted' };
    }

    // 2. Explicit DENY policies evaluation first
    for (const policy of this.customPolicies) {
      if (policy.effect === 'DENY' && policy.resourceType === resource.type && policy.actions.includes(action)) {
        if (!policy.condition || policy.condition(subject, resource, context)) {
          return { allowed: false, reason: `Explicitly denied by policy: ${policy.name}` };
        }
      }
    }

    // 3. RBAC standard permission check
    const requiredPermission = `${resource.type}:${action}`;
    const hasRbacPermission = subject.permissions.includes(requiredPermission) || subject.permissions.includes(`${resource.type}:*`);

    // 4. ABAC Contextual and Ownership evaluations
    if (hasRbacPermission) {
      // Check resource ownership if applicable
      if (resource.sellerId && subject.sellerId && resource.sellerId !== subject.sellerId) {
        // Seller cannot modify another seller's resource unless Admin
        if (!subject.roles.includes('ADMIN')) {
          return { allowed: false, reason: 'Cannot access or modify resource belonging to another seller' };
        }
      }

      if (resource.ownerId && resource.ownerId !== subject.userId) {
        // Customer cannot access another customer's cart/order/wishlist unless Admin
        if (!subject.roles.includes('ADMIN') && !subject.roles.includes('SUPPORT')) {
          return { allowed: false, reason: 'Cannot access private resource belonging to another user' };
        }
      }

      return { allowed: true, reason: 'Authorized by RBAC and ABAC policies' };
    }

    // 5. Check Custom ALLOW policies
    for (const policy of this.customPolicies) {
      if (policy.effect === 'ALLOW' && policy.resourceType === resource.type && policy.actions.includes(action)) {
        if (!policy.condition || policy.condition(subject, resource, context)) {
          return { allowed: true, reason: `Granted by policy: ${policy.name}` };
        }
      }
    }

    return { allowed: false, reason: `Missing required permission: ${requiredPermission}` };
  }

  private registerDefaultPolicies(): void {
    // Example: Public Catalog Read policy
    this.customPolicies.push({
      name: 'PublicCatalogRead',
      effect: 'ALLOW',
      resourceType: 'products',
      actions: ['read'],
      condition: (_s, resource) => resource.attributes?.status === 'PUBLISHED',
    });

    // Example: Own Cart Management policy
    this.customPolicies.push({
      name: 'OwnCartManagement',
      effect: 'ALLOW',
      resourceType: 'carts',
      actions: ['read', 'create', 'update', 'delete'],
      condition: (subject, resource) => resource.ownerId === subject.userId,
    });
  }
}
