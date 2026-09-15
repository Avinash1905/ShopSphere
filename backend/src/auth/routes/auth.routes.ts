/**
 * Authentication Versioned Express Routes (/api/v1/auth)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { createRateLimiter } from '../../middleware/rate-limiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../validators/auth.validators';
import { config } from '../../config';

const router = Router();

// Dedicated rate limiters for sensitive endpoints
const authRateLimiter = createRateLimiter({
  windowMs: config.security.rateLimit.authWindowMs,
  maxRequests: config.security.rateLimit.authMaxRequests,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

const passwordResetLimiter = createRateLimiter({
  windowMs: config.security.rateLimit.resetPasswordWindowMs,
  maxRequests: config.security.rateLimit.resetPasswordMaxRequests,
  message: 'Too many password reset attempts. Please try again in 30 minutes.',
});

// Public Authentication Endpoints
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Protected Authentication Endpoints
router.post('/logout', authenticate({ optional: true }), authController.logout);
router.post('/logout-all', authenticate(), authController.logoutAll);
router.get('/me', authenticate(), authController.getMe);
router.get('/sessions', authenticate(), authController.getSessions);
router.delete('/sessions/:id', authenticate(), authController.revokeSession);

export default router;
