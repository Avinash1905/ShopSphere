/**
 * Base Application Error
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { HttpStatus, HttpStatusCode, ErrorCode, ErrorCodeType } from '../../config/constants';

export interface SerializedError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
  path?: string;
  stack?: string;
}

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: ErrorCodeType | string;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCodeType | string = ErrorCode.INTERNAL_ERROR,
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public serialize(includeStack = false, requestId?: string, path?: string): SerializedError {
    const result: SerializedError = {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
    };

    if (this.details !== undefined && this.details !== null) {
      result.details = this.details;
    }

    if (requestId) {
      result.requestId = requestId;
    }

    if (path) {
      result.path = path;
    }

    if (includeStack && this.stack) {
      result.stack = this.stack;
    }

    return result;
  }
}
