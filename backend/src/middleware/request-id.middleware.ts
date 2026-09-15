/**
 * Request & Correlation ID Middleware
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SystemHeaders } from '../config/constants';

declare global {
  namespace Express {
    interface Request {
      id: string;
      correlationId: string;
      startTime: number;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers[SystemHeaders.REQUEST_ID] as string;
  const incomingCorrelation = req.headers[SystemHeaders.CORRELATION_ID] as string;

  const requestId = incomingId && incomingId.trim() !== '' ? incomingId : uuidv4();
  const correlationId = incomingCorrelation && incomingCorrelation.trim() !== '' ? incomingCorrelation : requestId;

  req.id = requestId;
  req.correlationId = correlationId;
  req.startTime = Date.now();

  res.setHeader(SystemHeaders.REQUEST_ID, requestId);
  res.setHeader(SystemHeaders.CORRELATION_ID, correlationId);

  res.locals.requestId = requestId;
  res.locals.correlationId = correlationId;
  res.locals.startTime = req.startTime;

  next();
}
