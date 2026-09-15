/**
 * Repository Factory and Registry
 * Clean Architectural Boundary for Member 3 Database Integration
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { IUserRepository } from '../interfaces/IUserRepository';
import { ISessionRepository } from '../interfaces/ISessionRepository';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository';
import { IPasswordResetRepository } from '../interfaces/IPasswordResetRepository';
import { IAddressRepository } from '../interfaces/IAddressRepository';
import { IUserPreferenceRepository, ILoginAttemptRepository, IAuditLogRepository } from '../interfaces/IUserPreferenceRepository';
import {
  MemoryUserRepository,
} from './MemoryUserRepository';
import {
  MemorySessionRepository,
} from './MemorySessionRepository';
import {
  MemoryRefreshTokenRepository,
} from './MemoryRefreshTokenRepository';
import {
  MemoryPasswordResetRepository,
} from './MemoryPasswordResetRepository';
import {
  MemoryAddressRepository,
} from './MemoryAddressRepository';
import {
  MemoryUserPreferenceRepository,
  MemoryLoginAttemptRepository,
  MemoryAuditLogRepository,
} from './MemoryUserPreferenceRepository';

export interface RepositoryContainer {
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  passwordResetRepository: IPasswordResetRepository;
  addressRepository: IAddressRepository;
  userPreferenceRepository: IUserPreferenceRepository;
  loginAttemptRepository: ILoginAttemptRepository;
  auditLogRepository: IAuditLogRepository;
}

export class RepositoryFactory {
  private static instance: RepositoryContainer | null = null;

  public static getRepositories(): RepositoryContainer {
    if (!this.instance) {
      this.instance = {
        userRepository: new MemoryUserRepository(),
        sessionRepository: new MemorySessionRepository(),
        refreshTokenRepository: new MemoryRefreshTokenRepository(),
        passwordResetRepository: new MemoryPasswordResetRepository(),
        addressRepository: new MemoryAddressRepository(),
        userPreferenceRepository: new MemoryUserPreferenceRepository(),
        loginAttemptRepository: new MemoryLoginAttemptRepository(),
        auditLogRepository: new MemoryAuditLogRepository(),
      };
    }
    return this.instance;
  }

  public static resetAll(): void {
    if (this.instance) {
      (this.instance.userRepository as MemoryUserRepository).clear();
      (this.instance.sessionRepository as MemorySessionRepository).clear();
      (this.instance.refreshTokenRepository as MemoryRefreshTokenRepository).clear();
      (this.instance.passwordResetRepository as MemoryPasswordResetRepository).clear();
      (this.instance.addressRepository as MemoryAddressRepository).clear();
      (this.instance.userPreferenceRepository as MemoryUserPreferenceRepository).clear();
      (this.instance.loginAttemptRepository as MemoryLoginAttemptRepository).clear();
      (this.instance.auditLogRepository as MemoryAuditLogRepository).clear();
    }
  }
}

export const repositories = RepositoryFactory.getRepositories();
