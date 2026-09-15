/**
 * Users Versioned Express Routes (/api/v1/users)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { addressController } from '../controllers/address.controller';
import { userPreferenceController } from '../controllers/user-preference.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { requireActiveAccount } from '../../middleware/account-status.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  updateProfileSchema,
  updatePreferencesSchema,
  adminUpdateUserStatusSchema,
  userQueryFilterSchema,
} from '../../validators/user.validators';
import {
  createAddressSchema,
  updateAddressSchema,
  addressQueryFilterSchema,
} from '../../validators/address.validators';
import { changePasswordSchema } from '../../validators/auth.validators';
import { Roles } from '../../config/constants';

const router = Router();

// All routes under /api/v1/users require authentication and active account status
router.use(authenticate(), requireActiveAccount);

// Current User Profile Routes
router.get('/me', userController.getProfile);
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);
router.patch('/me/password', validate(changePasswordSchema), userController.changePassword);

// User Addresses Routes (Strict User Ownership Enforced in Service & Controller)
router.post('/me/addresses', validate(createAddressSchema), addressController.createAddress);
router.get('/me/addresses', validate({ query: addressQueryFilterSchema }), addressController.getUserAddresses);
router.get('/me/addresses/:id', addressController.getAddressById);
router.patch('/me/addresses/:id', validate(updateAddressSchema), addressController.updateAddress);
router.delete('/me/addresses/:id', addressController.deleteAddress);
router.patch('/me/addresses/:id/default-shipping', addressController.setDefaultShipping);
router.patch('/me/addresses/:id/default-billing', addressController.setDefaultBilling);

// User Preferences Routes
router.get('/me/preferences', userPreferenceController.getPreferences);
router.patch('/me/preferences', validate(updatePreferencesSchema), userPreferenceController.updatePreferences);
router.post('/me/preferences/reset', userPreferenceController.resetPreferences);

// Administrative User Management Routes (ADMIN only)
router.get('/', requireRole(Roles.ADMIN), validate({ query: userQueryFilterSchema }), userController.listUsers);
router.get('/:id', requireRole(Roles.ADMIN), userController.getUserById);
router.patch('/:id/status', requireRole(Roles.ADMIN), validate(adminUpdateUserStatusSchema), userController.updateStatus);

export default router;
