/**
 * AsyncLocalStorage Context Binding Middleware
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../core/context/RequestContext';

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  RequestContext.run(
    {
      requestId: req.id,
      correlationId: req.correlationId,
      startTime: req.startTime,
      clientIp: Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim(),
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    },
    () => {
      next();
    }
  );
}
