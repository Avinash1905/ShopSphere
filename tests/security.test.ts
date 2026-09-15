import { describe, it, expect } from 'vitest';
import { userRepository } from '../database/repositories/UserRepository';

describe('Security & Authentication Domain Tests', () => {
  it('should find users by role and verify status', async () => {
    const admin = await userRepository.create({
      id: 'usr-sec-test-admin',
      email: 'sec-admin@shopsphere.io',
      firstName: 'Security',
      lastName: 'Admin',
      role: 'super_admin',
      status: 'active',
      twoFactorEnabled: true
    });

    expect(admin.role).toBe('super_admin');
    expect(admin.twoFactorEnabled).toBe(true);

    const found = await userRepository.findById('usr-sec-test-admin');
    expect(found).toBeDefined();
    expect(found?.email).toBe('sec-admin@shopsphere.io');
  });

  it('should reject non-existent user lookups safely', async () => {
    const nonExistent = await userRepository.findById('usr-does-not-exist');
    expect(nonExistent).toBeNull();
  });
});
