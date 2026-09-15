/**
 * 404 Route Not Found Middleware
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response } from 'express';
import { ResponseBuilder } from '../core/response/ApiResponse';
import { HttpStatus, ErrorCode } from '../config/constants';

export function notFoundMiddleware(req: Request, res: Response): void {
  ResponseBuilder.error(
    res,
    {
      code: ErrorCode.NOT_FOUND,
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
      path: req.originalUrl,
    },
    HttpStatus.NOT_FOUND
  );
}
