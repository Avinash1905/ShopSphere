/**
 * Central Users Services Export & Service Locator Factory
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { repositories } from '../../repositories';
import { authServices } from '../../auth/services';
import { UserService } from './user.service';
import { AddressService } from './address.service';
import { UserPreferenceService } from './user-preference.service';

export * from './user.service';
export * from './address.service';
export * from './user-preference.service';

export interface UserServicesContainer {
  userService: UserService;
  addressService: AddressService;
  userPreferenceService: UserPreferenceService;
}

export class UserServiceFactory {
  private static instance: UserServicesContainer | null = null;

  public static getServices(): UserServicesContainer {
    if (!this.instance) {
      const userService = new UserService(
        repositories.userRepository,
        repositories.sessionRepository,
        repositories.auditLogRepository,
        authServices.passwordService
      );

      const addressService = new AddressService(
        repositories.addressRepository,
        repositories.auditLogRepository
      );

      const userPreferenceService = new UserPreferenceService(
        repositories.userPreferenceRepository,
        repositories.auditLogRepository
      );

      this.instance = {
        userService,
        addressService,
        userPreferenceService,
      };
    }

    return this.instance;
  }
}

export const userServices = UserServiceFactory.getServices();
