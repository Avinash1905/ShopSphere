/**
 * Centralized Application Error Handling Middleware
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/AppError';
import { ResponseBuilder } from '../core/response/ApiResponse';
import { logger } from '../core/logger/Logger';
import { HttpStatus, ErrorCode } from '../config/constants';
import { config } from '../config';

export function errorHandlerMiddleware(err: Error | AppError, req: Request, res: Response, _next: NextFunction): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
  const errorCode = isAppError ? err.code : ErrorCode.INTERNAL_ERROR;
  const message = isAppError
    ? err.message
    : config.isProduction
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal Server Error';

  const details = isAppError ? err.details : undefined;

  // Log the error
  if (statusCode >= 500) {
    logger.error(`Unhandled Error on ${req.method} ${req.originalUrl}:`, err, {
      statusCode,
      errorCode,
      details,
      ip: req.ip,
    });
  } else {
    logger.warn(`Operational Error on ${req.method} ${req.originalUrl}: ${err.message}`, {
      statusCode,
      errorCode,
      details,
    });
  }

  // Do not expose stack traces in production
  const stack = config.isDevelopment || config.isTest ? err.stack : undefined;

  ResponseBuilder.error(
    res,
    {
      code: errorCode,
      message,
      details,
      path: req.originalUrl || req.url,
      stack,
    },
    statusCode
  );
}
