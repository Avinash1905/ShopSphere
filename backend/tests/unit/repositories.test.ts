/**
 * Unit Tests: In-Memory Repositories (Member 3 Boundary)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryUserRepository } from '../../src/repositories/memory/MemoryUserRepository';
import { MemorySessionRepository } from '../../src/repositories/memory/MemorySessionRepository';
import { MemoryRefreshTokenRepository } from '../../src/repositories/memory/MemoryRefreshTokenRepository';
import { MemoryAddressRepository } from '../../src/repositories/memory/MemoryAddressRepository';
import { Roles, AccountStatus, AddressType } from '../../src/config/constants';

describe('In-Memory Repositories Layer', () => {
  let userRepo: MemoryUserRepository;
  let sessionRepo: MemorySessionRepository;
  let refreshTokenRepo: MemoryRefreshTokenRepository;
  let addressRepo: MemoryAddressRepository;

  beforeEach(() => {
    userRepo = new MemoryUserRepository();
    sessionRepo = new MemorySessionRepository();
    refreshTokenRepo = new MemoryRefreshTokenRepository();
    addressRepo = new MemoryAddressRepository();
  });

  it('should create and index users by email and username', async () => {
    const user = await userRepo.create({
      id: 'u-1',
      email: 'john@example.com',
      username: 'johndoe',
      passwordHash: 'hash123',
      role: Roles.CUSTOMER,
      status: AccountStatus.ACTIVE,
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    assert.equal(user.id, 'u-1');

    const byEmail = await userRepo.findByEmail('JOHN@EXAMPLE.COM');
    assert.equal(byEmail?.id, 'u-1');

    const byUsername = await userRepo.findByUsername('JohnDoe');
    assert.equal(byUsername?.id, 'u-1');

    const exists = await userRepo.existsByEmail('john@example.com');
    assert.equal(exists, true);
  });

  it('should search users with pagination and filters', async () => {
    for (let i = 1; i <= 5; i++) {
      await userRepo.create({
        id: `u-${i}`,
        email: `user${i}@example.com`,
        username: `user${i}`,
        passwordHash: 'hash',
        role: i % 2 === 0 ? Roles.SELLER : Roles.CUSTOMER,
        status: AccountStatus.ACTIVE,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        emailVerified: true,
        createdAt: new Date(Date.now() + i * 1000),
        updatedAt: new Date(),
      });
    }

    const searchRes = await userRepo.searchUsers({ role: Roles.SELLER }, 0, 10);
    assert.equal(searchRes.total, 2);
    assert.equal(searchRes.users.length, 2);

    const nameSearch = await userRepo.searchUsers({ search: 'user3' });
    assert.equal(nameSearch.total, 1);
    assert.equal(nameSearch.users[0].id, 'u-3');
  });

  it('should manage sessions, active status, and revocations', async () => {
    const s1 = await sessionRepo.create({
      id: 's-1',
      userId: 'u-1',
      tokenHash: 'hash1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    const s2 = await sessionRepo.create({
      id: 's-2',
      userId: 'u-1',
      tokenHash: 'hash2',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    let active = await sessionRepo.findActiveByUserId('u-1');
    assert.equal(active.length, 2);

    // Revoke other sessions
    await sessionRepo.revokeOtherUserSessions('u-1', 's-1');
    active = await sessionRepo.findActiveByUserId('u-1');
    assert.equal(active.length, 1);
    assert.equal(active[0].id, 's-1');

    // Revoke all
    await sessionRepo.revokeAllUserSessions('u-1');
    active = await sessionRepo.findActiveByUserId('u-1');
    assert.equal(active.length, 0);
  });

  it('should manage refresh token family and reuse detection tracking', async () => {
    const t1 = await refreshTokenRepo.create({
      id: 't-1',
      userId: 'u-1',
      familyId: 'family-1',
      tokenHash: 'tokenhash1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date(),
    });

    const t2 = await refreshTokenRepo.create({
      id: 't-2',
      userId: 'u-1',
      familyId: 'family-1',
      tokenHash: 'tokenhash2',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 600000),
      createdAt: new Date(),
    });

    // Revoke entire family on breach
    const revokedCount = await refreshTokenRepo.revokeTokenFamily('family-1');
    assert.equal(revokedCount, 2);

    const check1 = await refreshTokenRepo.findById('t-1');
    const check2 = await refreshTokenRepo.findById('t-2');
    assert.equal(check1?.isRevoked, true);
    assert.equal(check2?.isRevoked, true);
  });

  it('should handle address ownership and default address toggles', async () => {
    const addr1 = await addressRepo.create({
      id: 'a-1',
      userId: 'u-1',
      recipientName: 'John Doe',
      phoneNumber: '+1234567890',
      streetLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      countryCode: 'US',
      addressType: AddressType.SHIPPING,
      isDefaultShipping: true,
      isDefaultBilling: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const addr2 = await addressRepo.create({
      id: 'a-2',
      userId: 'u-1',
      recipientName: 'John Doe',
      phoneNumber: '+1234567890',
      streetLine1: '456 Broadway',
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
      countryCode: 'US',
      addressType: AddressType.SHIPPING,
      isDefaultShipping: true, // Setting second address as default should unset first
      isDefaultBilling: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updated1 = await addressRepo.findById('a-1');
    assert.equal(updated1?.isDefaultShipping, false);

    const defaultShipping = await addressRepo.findDefaultShipping('u-1');
    assert.equal(defaultShipping?.id, 'a-2');

    // Verify cross-user isolation: User 2 cannot access Address 1
    const crossAccess = await addressRepo.findByIdAndUserId('a-1', 'u-2');
    assert.equal(crossAccess, null);
  });
});
