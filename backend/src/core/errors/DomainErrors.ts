/**
 * Specialized Application Errors Hierarchy
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { AppError } from './AppError';
import { HttpStatus, ErrorCode, ErrorCodeType } from '../../config/constants';

export interface FieldValidationError {
  field: string;
  message: string;
  code?: string;
  received?: unknown;
}

export class ValidationError extends AppError {
  public readonly fieldErrors: FieldValidationError[];

  constructor(message = 'Validation failed', fieldErrors: FieldValidationError[] = [], details?: unknown) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, true, details || { errors: fieldErrors });
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', code: ErrorCodeType = ErrorCode.AUTHENTICATION_REQUIRED, details?: unknown) {
    super(message, HttpStatus.UNAUTHORIZED, code, true, details);
    this.name = 'AuthenticationError';
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(message = 'Invalid email or password', details?: unknown) {
    super(message, ErrorCode.INVALID_CREDENTIALS, details);
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(message = 'Invalid or corrupted authentication token', details?: unknown) {
    super(message, ErrorCode.INVALID_TOKEN, details);
    this.name = 'InvalidTokenError';
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message = 'Authentication token has expired', details?: unknown) {
    super(message, ErrorCode.TOKEN_EXPIRED, details);
    this.name = 'TokenExpiredError';
  }
}

export class TokenRevokedError extends AuthenticationError {
  constructor(message = 'Authentication token has been revoked', details?: unknown) {
    super(message, ErrorCode.TOKEN_REVOKED, details);
    this.name = 'TokenRevokedError';
  }
}

export class TokenReusedBreachError extends AuthenticationError {
  constructor(message = 'Security breach: Revoked refresh token reused. All sessions terminated.', details?: unknown) {
    super(message, ErrorCode.TOKEN_REUSED, details);
    this.name = 'TokenReusedBreachError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action', code: ErrorCodeType = ErrorCode.FORBIDDEN, details?: unknown) {
    super(message, HttpStatus.FORBIDDEN, code, true, details);
    this.name = 'AuthorizationError';
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(requiredPermissions: string[] = [], details?: unknown) {
    super(`Access denied. Missing required permissions: ${requiredPermissions.join(', ')}`, ErrorCode.INSUFFICIENT_PERMISSIONS, details);
    this.name = 'InsufficientPermissionsError';
  }
}

export class RoleEscalationError extends AuthorizationError {
  constructor(message = 'Privilege escalation detected. Cannot self-assign elevated roles.', details?: unknown) {
    super(message, ErrorCode.ROLE_ESCALATION_DENIED, details);
    this.name = 'RoleEscalationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id?: string | number, details?: unknown) {
    const message = id !== undefined ? `${resource} with ID '${id}' was not found` : `${resource} was not found`;
    super(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, true, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'A conflicting resource already exists', code: ErrorCodeType = ErrorCode.CONFLICT, details?: unknown) {
    super(message, HttpStatus.CONFLICT, code, true, details);
    this.name = 'ConflictError';
  }
}

export class EmailAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(`An account with email '${email}' already exists`, ErrorCode.EMAIL_ALREADY_EXISTS, { email });
    this.name = 'EmailAlreadyExistsError';
  }
}

export class UsernameAlreadyExistsError extends ConflictError {
  constructor(username: string) {
    super(`An account with username '${username}' already exists`, ErrorCode.USERNAME_ALREADY_EXISTS, { username });
    this.name = 'UsernameAlreadyExistsError';
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, code: ErrorCodeType = ErrorCode.INTERNAL_ERROR, details?: unknown) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, code, true, details);
    this.name = 'BusinessRuleError';
  }
}

export class AccountLockedError extends AppError {
  public readonly unlockAt: Date;

  constructor(message = 'Account has been temporarily locked due to excessive failed attempts', unlockAt: Date, details?: unknown) {
    super(message, HttpStatus.LOCKED, ErrorCode.ACCOUNT_LOCKED, true, {
      ...((details as object) || {}),
      unlockAt: unlockAt.toISOString(),
    });
    this.name = 'AccountLockedError';
    this.unlockAt = unlockAt;
  }
}

export class AccountSuspendedError extends AppError {
  constructor(message = 'Your account has been suspended. Please contact customer support.', details?: unknown) {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.ACCOUNT_SUSPENDED, true, details);
    this.name = 'AccountSuspendedError';
  }
}

export class AccountInactiveError extends AppError {
  constructor(message = 'Your account is inactive.', details?: unknown) {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.ACCOUNT_INACTIVE, true, details);
    this.name = 'AccountInactiveError';
  }
}

export class PasswordPolicyError extends AppError {
  public readonly violations: string[];

  constructor(violations: string[] = [], message = 'Password does not meet security requirements') {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.PASSWORD_TOO_WEAK, true, { violations });
    this.name = 'PasswordPolicyError';
    this.violations = violations;
  }
}

export class PasswordResetTokenInvalidError extends AppError {
  constructor(message = 'Password reset token is invalid or has already been used') {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.PASSWORD_RESET_TOKEN_INVALID, true);
    this.name = 'PasswordResetTokenInvalidError';
  }
}

export class PasswordResetTokenExpiredError extends AppError {
  constructor(message = 'Password reset token has expired. Please request a new one.') {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED, true);
    this.name = 'PasswordResetTokenExpiredError';
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message = 'Too many requests. Please try again later.') {
    super(message, HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMIT_EXCEEDED, true, { retryAfterSeconds });
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'A database operation failed', originalError?: Error) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.DATABASE_ERROR, false, {
      originalMessage: originalError?.message,
    });
    this.name = 'DatabaseError';
  }
}
