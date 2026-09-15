/**
 * Express Application Setup & Middleware Orchestration
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from './routes';
import {
  requestIdMiddleware,
  requestContextMiddleware,
  requestLoggerMiddleware,
  errorHandlerMiddleware,
  notFoundMiddleware,
  securityHeadersMiddleware,
  corsMiddleware,
  createRateLimiter,
} from './middleware';
import { ResponseBuilder } from './core/response/ApiResponse';
import { config } from './config';

export function createApp(): Application {
  const app: Application = express();

  // Trust proxy if configured (for deployment behind load balancers/reverse proxies)
  if (config.env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  // 1. Security Headers Middleware (OWASP baseline)
  app.use(securityHeadersMiddleware);

  // 2. CORS Handling
  app.use(corsMiddleware);

  // 3. Body & Cookie Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(config.env.COOKIE_SECRET));

  // 4. Request Correlation & Context Binding
  app.use(requestIdMiddleware);
  app.use(requestContextMiddleware);

  // 5. Structured Traffic Logging
  app.use(requestLoggerMiddleware);

  // 6. Global Rate Limiter
  app.use(
    createRateLimiter({
      windowMs: config.security.rateLimit.windowMs,
      maxRequests: config.security.rateLimit.maxRequests,
      skip: (req: Request) => req.path === '/health' || req.path === '/ready' || req.path === '/live',
    })
  );

  // 7. System Health & Observability Probes
  app.get('/health', (_req: Request, res: Response) => {
    ResponseBuilder.success(res, {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: config.env.APP_NAME,
      version: config.env.APP_VERSION,
      environment: config.env.NODE_ENV,
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      },
    });
  });

  app.get('/ready', (_req: Request, res: Response) => {
    ResponseBuilder.success(res, {
      ready: true,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/live', (_req: Request, res: Response) => {
    ResponseBuilder.success(res, {
      live: true,
      timestamp: new Date().toISOString(),
    });
  });

  // 8. Mount Versioned API Routes (/api/v1/...)
  app.use(config.env.API_PREFIX, apiRouter);

  // 9. Route 404 Fallback
  app.use(notFoundMiddleware);

  // 10. Centralized Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
