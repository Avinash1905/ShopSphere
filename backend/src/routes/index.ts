/**
 * API Route Registry and Versioning
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Router } from 'express';
import { authRoutes } from '../auth/routes';
import { userRoutes } from '../users/routes';
import { ResponseBuilder } from '../core/response/ApiResponse';
import { config } from '../config';

const router = Router();

// API Root Information
router.get('/', (_req, res) => {
  ResponseBuilder.success(res, {
    name: config.env.APP_NAME,
    version: config.env.APP_VERSION,
    status: 'ONLINE',
    phase: 'MEMBER_2_PHASE_1_FOUNDATION_AUTH_USERS',
    endpoints: {
      auth: `${config.env.API_PREFIX}/auth`,
      users: `${config.env.API_PREFIX}/users`,
    },
  });
});

// Versioned Route Mounts (/api/v1/...)
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
