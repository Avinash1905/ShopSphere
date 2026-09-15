/**
 * Attribute-Based Access Control (ABAC) Context Policy Evaluator
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Role, Roles, AccountStatus, Permission } from '../../config/constants';
import { AuthenticatedUserContext } from '../auth.types';

export interface EvaluationSubject {
  id: string;
  role: Role;
  permissions: Permission[];
  status: string;
  emailVerified: boolean;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface EvaluationResource {
  type: 'USER' | 'ADDRESS' | 'PREFERENCE' | 'SESSION' | 'AUDIT_LOG';
  id: string;
  ownerId?: string;
  status?: string;
  isRestricted?: boolean;
}

export interface EvaluationEnvironment {
  timestamp: Date;
  ipAddress?: string;
  isSecureConnection: boolean;
}

export type PolicyDecision = 'ALLOW' | 'DENY';

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reason?: string;
  evaluatedPolicies: string[];
}

export class AbacPolicyEngine {
  /**
   * Evaluates if a subject can perform an action on a resource under given environment
   */
  public static evaluate(
    subject: EvaluationSubject,
    action: string,
    resource: EvaluationResource,
    environment: EvaluationEnvironment = { timestamp: new Date(), isSecureConnection: true }
  ): PolicyEvaluationResult {
    const evaluatedPolicies: string[] = [];

    // 1. Account Status Policy: Suspended or Inactive subjects are always denied
    evaluatedPolicies.push('AccountStatusPolicy');
    if (subject.status === AccountStatus.SUSPENDED) {
      return { decision: 'DENY', reason: 'Account is suspended', evaluatedPolicies };
    }
    if (subject.status === AccountStatus.INACTIVE) {
      return { decision: 'DENY', reason: 'Account is inactive', evaluatedPolicies };
    }

    // 2. Admin Superuser Policy: Admins can access all resources
    evaluatedPolicies.push('AdminSuperuserPolicy');
    if (subject.role === Roles.ADMIN) {
      return { decision: 'ALLOW', reason: 'Administrator override', evaluatedPolicies };
    }

    // 3. Resource Ownership Policy: A user can access their own resources
    evaluatedPolicies.push('ResourceOwnershipPolicy');
    if (resource.ownerId && resource.ownerId === subject.id) {
      return { decision: 'ALLOW', reason: 'Resource owner permitted', evaluatedPolicies };
    }

    // 4. Cross-tenant / Cross-user Protection: Deny if resource belongs to someone else
    if (resource.ownerId && resource.ownerId !== subject.id) {
      return { decision: 'DENY', reason: 'Cross-user access denied', evaluatedPolicies };
    }

    // Default deny
    return { decision: 'DENY', reason: 'No matching permissive policy', evaluatedPolicies };
  }
}
