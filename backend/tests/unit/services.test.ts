/**
 * Unit Tests: Domain Business Services
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { RepositoryFactory } from '../../src/repositories/memory/RepositoryFactory';
import { AuthServiceFactory } from '../../src/auth/services';
import { UserServiceFactory } from '../../src/users/services';
import { Roles, AccountStatus, AddressType } from '../../src/config/constants';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  RoleEscalationError,
  InvalidCredentialsError,
  AccountLockedError,
  AuthorizationError,
  PasswordResetTokenInvalidError,
} from '../../src/core/errors/DomainErrors';

describe('Domain Business Services', () => {
  let authServices: ReturnType<typeof AuthServiceFactory.getServices>;
  let userServices: ReturnType<typeof UserServiceFactory.getServices>;

  beforeEach(() => {
    RepositoryFactory.resetAll();
    authServices = AuthServiceFactory.getServices();
    userServices = UserServiceFactory.getServices();
  });

  describe('AuthService', () => {
    it('should successfully register a customer', async () => {
      const result = await authServices.authService.register({
        email: 'customer@shopsphere.com',
        username: 'shopsphere_cust',
        password: 'Sphere#Secure2026!',
        firstName: 'John',
        lastName: 'Customer',
        role: Roles.CUSTOMER,
      });

      assert.equal(result.user.email, 'customer@shopsphere.com');
      assert.equal(result.user.role, Roles.CUSTOMER);
      assert.equal(result.user.status, AccountStatus.ACTIVE);
      assert(result.tokens.accessToken.length > 20);
      assert(result.tokens.refreshToken.length > 20);
    });

    it('should reject registration with ADMIN role (privilege escalation)', async () => {
      await assert.rejects(
        async () => {
          await authServices.authService.register({
            email: 'fakeadmin@shopsphere.com',
            username: 'fake_admin',
            password: 'Sphere#Secure2026!',
            firstName: 'Fake',
            lastName: 'Admin',
            role: Roles.ADMIN,
          });
        },
        (err: any) => {
          assert(err instanceof RoleEscalationError);
          return true;
        }
      );
    });

    it('should reject duplicate email or username registration', async () => {
      await authServices.authService.register({
        email: 'duplicate@shopsphere.com',
        username: 'user_orig',
        password: 'Sphere#Secure2026!',
        firstName: 'Orig',
        lastName: 'User',
      });

      await assert.rejects(
        async () => {
          await authServices.authService.register({
            email: 'duplicate@shopsphere.com',
            username: 'user_new',
            password: 'Sphere#Secure2026!',
            firstName: 'New',
            lastName: 'User',
          });
        },
        (err: any) => {
          assert(err instanceof EmailAlreadyExistsError);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await authServices.authService.register({
            email: 'different@shopsphere.com',
            username: 'user_orig',
            password: 'Sphere#Secure2026!',
            firstName: 'New',
            lastName: 'User',
          });
        },
        (err: any) => {
          assert(err instanceof UsernameAlreadyExistsError);
          return true;
        }
      );
    });

    it('should login cleanly with valid credentials and reject invalid credentials', async () => {
      await authServices.authService.register({
        email: 'valid@shopsphere.com',
        username: 'valid_user',
        password: 'Sphere#Secure2026!',
        firstName: 'Valid',
        lastName: 'User',
      });

      const loginRes = await authServices.authService.login({
        emailOrUsername: 'valid@shopsphere.com',
        password: 'Sphere#Secure2026!',
      });

      assert.equal(loginRes.user.email, 'valid@shopsphere.com');
      assert(loginRes.tokens.accessToken.length > 20);

      await assert.rejects(
        async () => {
          await authServices.authService.login({
            emailOrUsername: 'valid@shopsphere.com',
            password: 'WrongPassword123!',
          });
        },
        (err: any) => {
          assert(err instanceof InvalidCredentialsError);
          return true;
        }
      );
    });

    it('should lock account after exceeding maximum failed login attempts', async () => {
      const email = 'lockout_test@shopsphere.com';
      await authServices.authService.register({
        email,
        username: 'lockout_user',
        password: 'Sphere#Secure2026!',
        firstName: 'Lockout',
        lastName: 'Test',
      });

      // 5 consecutive failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authServices.authService.login({
            emailOrUsername: email,
            password: 'BadPassword!',
          });
        } catch {
          // Expected
        }
      }

      // Next attempt should throw AccountLockedError
      await assert.rejects(
        async () => {
          await authServices.authService.login({
            emailOrUsername: email,
            password: 'Sphere#Secure2026!',
          });
        },
        (err: any) => {
          assert(err instanceof AccountLockedError);
          return true;
        }
      );
    });
  });

  describe('PasswordResetService', () => {
    it('should dispatch local reset token and allow password reset', async () => {
      const email = 'reset_test@shopsphere.com';
      await authServices.authService.register({
        email,
        username: 'reset_user',
        password: 'Sphere#Secure2026!',
        firstName: 'Reset',
        lastName: 'User',
      });

      const resetReq = await authServices.passwordResetService.requestPasswordReset(email);
      assert.equal(resetReq.success, true);
      assert(resetReq.localTokenForDev !== undefined);

      const token = resetReq.localTokenForDev!;

      // Reset password
      const resetSuccess = await authServices.passwordResetService.resetPassword(token, 'NewSphere#Secure2026!');
      assert.equal(resetSuccess, true);

      // Verify cannot reuse reset token
      await assert.rejects(
        async () => {
          await authServices.passwordResetService.resetPassword(token, 'AnotherSphere#Secure2026!');
        },
        (err: any) => {
          assert(err instanceof PasswordResetTokenInvalidError);
          return true;
        }
      );

      // Verify login works with new password
      const newLogin = await authServices.authService.login({
        emailOrUsername: email,
        password: 'NewSphere#Secure2026!',
      });
      assert.equal(newLogin.user.email, email);
    });
  });

  describe('AddressService', () => {
    it('should create address, set default, and prevent cross-user access', async () => {
      const userA = await authServices.authService.register({
        email: 'usera@shopsphere.com',
        username: 'usera',
        password: 'Sphere#Secure2026!',
        firstName: 'User',
        lastName: 'A',
      });

      const userB = await authServices.authService.register({
        email: 'userb@shopsphere.com',
        username: 'userb',
        password: 'Sphere#Secure2026!',
        firstName: 'User',
        lastName: 'B',
      });

      const addressA = await userServices.addressService.createAddress(userA.user.id, {
        recipientName: 'User A',
        phoneNumber: '+12125551234',
        streetLine1: '100 Broadway',
        city: 'New York',
        state: 'NY',
        postalCode: '10005',
        countryCode: 'US',
        isDefaultShipping: true,
      });

      assert.equal(addressA.userId, userA.user.id);
      assert.equal(addressA.isDefaultShipping, true);

      // User A can view their own address
      const fetchedByA = await userServices.addressService.getAddressById(addressA.id, userA.user.id);
      assert.equal(fetchedByA.id, addressA.id);

      // User B attempting to view User A's address must be REJECTED
      await assert.rejects(
        async () => {
          await userServices.addressService.getAddressById(addressA.id, userB.user.id);
        },
        (err: any) => {
          assert(err instanceof AuthorizationError);
          return true;
        }
      );

      // User B attempting to delete User A's address must be REJECTED
      await assert.rejects(
        async () => {
          await userServices.addressService.deleteAddress(addressA.id, userB.user.id);
        },
        (err: any) => {
          assert(err instanceof AuthorizationError);
          return true;
        }
      );
    });
  });

  describe('UserService & Preferences', () => {
    it('should update profile and preferences cleanly', async () => {
      const reg = await authServices.authService.register({
        email: 'profile_test@shopsphere.com',
        username: 'profile_user',
        password: 'Sphere#Secure2026!',
        firstName: 'InitialFirst',
        lastName: 'InitialLast',
      });

      const updatedProfile = await userServices.userService.updateProfile(reg.user.id, {
        firstName: 'UpdatedFirst',
        bio: 'Hello ShopSphere!',
      });

      assert.equal(updatedProfile.firstName, 'UpdatedFirst');
      assert.equal(updatedProfile.bio, 'Hello ShopSphere!');

      const updatedPrefs = await userServices.userPreferenceService.updatePreferences(reg.user.id, {
        theme: 'dark',
        marketingEmails: true,
      });

      assert.equal(updatedPrefs.theme, 'dark');
      assert.equal(updatedPrefs.marketingEmails, true);
    });
  });
});
