/**
 * ShopSphere Security Subsystem - Declarative ABAC Policy Evaluator
 * Supports:
 * - User subject attributes: role, id, tenantId, clearanceLevel, isEmailVerified
 * - Resource attributes: type, ownerId, sellerId, status, isArchived
 * - Environment attributes: ipAddress, isBusinessHours, countryCode
 * - Action: 'CREATE', 'READ', 'UPDATE', 'DELETE', 'REFUND', 'PAYOUT'
 */

export interface SecuritySubject {
  id: string;
  role: string;
  sellerId?: string;
  clearanceLevel?: number;
  isVerified?: boolean;
}

export interface SecurityResource {
  type: string;
  id: string;
  ownerId?: string;
  sellerId?: string;
  status?: string;
}

export interface SecurityEnvironment {
  ipAddress?: string;
  isBusinessHours?: boolean;
  countryCode?: string;
}

export interface ABACPolicyRule {
  id: string;
  name: string;
  effect: 'ALLOW' | 'DENY';
  action: string | '*';
  resourceType: string | '*';
  condition: (subject: SecuritySubject, resource: SecurityResource, env?: SecurityEnvironment) => boolean;
}

export class ABACPolicyEvaluator {
  private static policies: ABACPolicyRule[] = [
    {
      id: 'admin-full-access',
      name: 'Admins have unrestricted global access',
      effect: 'ALLOW',
      action: '*',
      resourceType: '*',
      condition: (subj) => subj.role === 'ADMIN' || subj.role === 'SUPER_ADMIN',
    },
    {
      id: 'seller-own-products-only',
      name: 'Sellers can manage products they own',
      effect: 'ALLOW',
      action: '*',
      resourceType: 'product',
      condition: (subj, res) => subj.role === 'SELLER' && !!subj.sellerId && subj.sellerId === res.sellerId,
    },
    {
      id: 'customer-own-orders-only',
      name: 'Customers can only view and update their own orders',
      effect: 'ALLOW',
      action: 'READ',
      resourceType: 'order',
      condition: (subj, res) => !!subj.id && subj.id === res.ownerId,
    },
    {
      id: 'block-unverified-payouts',
      name: 'Block seller payouts if seller account is not verified',
      effect: 'DENY',
      action: 'PAYOUT',
      resourceType: 'seller_account',
      condition: (subj) => !subj.isVerified,
    },
  ];

  public static evaluate(
    subject: SecuritySubject,
    action: string,
    resource: SecurityResource,
    env?: SecurityEnvironment
  ): { allowed: boolean; matchedRule?: string; reason: string } {
    // 1. Check explicit DENY rules first
    for (const rule of this.policies) {
      if (rule.effect === 'DENY') {
        const actionMatch = rule.action === '*' || rule.action === action;
        const resourceMatch = rule.resourceType === '*' || rule.resourceType === resource.type;
        if (actionMatch && resourceMatch && rule.condition(subject, resource, env)) {
          return { allowed: false, matchedRule: rule.id, reason: `Explicitly denied by policy '${rule.name}'` };
        }
      }
    }

    // 2. Check ALLOW rules
    for (const rule of this.policies) {
      if (rule.effect === 'ALLOW') {
        const actionMatch = rule.action === '*' || rule.action === action;
        const resourceMatch = rule.resourceType === '*' || rule.resourceType === resource.type;
        if (actionMatch && resourceMatch && rule.condition(subject, resource, env)) {
          return { allowed: true, matchedRule: rule.id, reason: `Granted by policy '${rule.name}'` };
        }
      }
    }

    return { allowed: false, reason: 'Default deny: no matching policy granted permission.' };
  }
}
