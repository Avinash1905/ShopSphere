/**
 * CORS Middleware with Configurable Whitelists
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin as string;
  const allowedOrigins = config.security.cors.allowedOrigins;

  // Check if origin is allowed or wildcard in dev
  let isAllowed = false;
  if (!origin) {
    // Allow non-browser requests (Postman, curl, server-to-server)
    isAllowed = true;
  } else if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    isAllowed = true;
  } else if (config.isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    isAllowed = true;
  }

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (config.security.cors.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', config.security.cors.allowedMethods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', config.security.cors.allowedHeaders.join(', '));
  res.setHeader('Access-Control-Expose-Headers', config.security.cors.exposedHeaders.join(', '));
  res.setHeader('Access-Control-Max-Age', config.security.cors.maxAgeSeconds.toString());

  // Respond immediately to OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
