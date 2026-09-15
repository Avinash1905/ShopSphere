/**
 * Structured HTTP Request Logger Middleware
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../core/logger/Logger';
import { LogRedactor } from '../core/logger/LogRedactor';
import { SystemHeaders } from '../config/constants';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Log incoming request
  logger.info(`--> ${req.method} ${req.originalUrl || req.url}`, {
    method: req.method,
    url: req.originalUrl || req.url,
    query: Object.keys(req.query).length > 0 ? LogRedactor.redact(req.query) : undefined,
    ip: req.ip,
  });

  // Intercept finish to log response duration and status
  res.on('finish', () => {
    const duration = Date.now() - start;

    const message = `<-- ${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`;

    if (res.statusCode >= 500) {
      logger.error(message, undefined, { statusCode: res.statusCode, durationMs: duration });
    } else if (res.statusCode >= 400) {
      logger.warn(message, { statusCode: res.statusCode, durationMs: duration });
    } else {
      logger.info(message, { statusCode: res.statusCode, durationMs: duration });
    }
  });

  next();
}
