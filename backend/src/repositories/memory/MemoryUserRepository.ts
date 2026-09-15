/**
 * In-Memory User Repository Implementation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { IUserRepository, UserSearchCriteria } from '../interfaces/IUserRepository';
import { UserEntity } from '../../users/users.types';
import { AccountStatusType } from '../../config/constants';
import { QueryFilter, QueryOptions } from '../interfaces/IBaseRepository';

export class MemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, UserEntity>();
  private readonly emailIndex = new Map<string, string>(); // lowercase email -> id
  private readonly usernameIndex = new Map<string, string>(); // lowercase username -> id

  public async findById(id: string): Promise<UserEntity | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const id = this.emailIndex.get(email.toLowerCase().trim());
    if (!id) return null;
    return this.findById(id);
  }

  public async findByUsername(username: string): Promise<UserEntity | null> {
    const id = this.usernameIndex.get(username.toLowerCase().trim());
    if (!id) return null;
    return this.findById(id);
  }

  public async findByEmailOrUsername(identifier: string): Promise<UserEntity | null> {
    const clean = identifier.toLowerCase().trim();
    const id = this.emailIndex.get(clean) || this.usernameIndex.get(clean);
    if (!id) return null;
    return this.findById(id);
  }

  public async existsByEmail(email: string): Promise<boolean> {
    return this.emailIndex.has(email.toLowerCase().trim());
  }

  public async existsByUsername(username: string): Promise<boolean> {
    return this.usernameIndex.has(username.toLowerCase().trim());
  }

  public async findAll(filter?: QueryFilter<UserEntity>, options?: QueryOptions<UserEntity>): Promise<UserEntity[]> {
    let result = Array.from(this.users.values());

    if (filter) {
      result = result.filter((u) => {
        for (const [key, expected] of Object.entries(filter)) {
          if (expected !== undefined && (u as any)[key] !== expected) {
            return false;
          }
        }
        return true;
      });
    }

    if (options?.sort) {
      const [sortField, sortDir] = Object.entries(options.sort)[0] as [keyof UserEntity, 'asc' | 'desc'];
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === undefined || valB === undefined) return 0;
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || result.length;
    return result.slice(skip, skip + limit).map((u) => ({ ...u }));
  }

  public async count(filter?: QueryFilter<UserEntity>): Promise<number> {
    const all = await this.findAll(filter);
    return all.length;
  }

  public async create(entity: UserEntity): Promise<UserEntity> {
    const id = entity.id || uuidv4();
    const now = new Date();
    const created: UserEntity = {
      ...entity,
      id,
      email: entity.email.toLowerCase().trim(),
      username: entity.username.toLowerCase().trim(),
      createdAt: entity.createdAt || now,
      updatedAt: entity.updatedAt || now,
    };

    this.users.set(id, created);
    this.emailIndex.set(created.email, id);
    this.usernameIndex.set(created.username, id);

    return { ...created };
  }

  public async update(id: string, partial: Partial<UserEntity>): Promise<UserEntity | null> {
    const existing = this.users.get(id);
    if (!existing) return null;

    // Handle email re-indexing if updated
    if (partial.email && partial.email.toLowerCase() !== existing.email) {
      this.emailIndex.delete(existing.email);
      this.emailIndex.set(partial.email.toLowerCase().trim(), id);
    }

    // Handle username re-indexing if updated
    if (partial.username && partial.username.toLowerCase() !== existing.username) {
      this.usernameIndex.delete(existing.username);
      this.usernameIndex.set(partial.username.toLowerCase().trim(), id);
    }

    const updated: UserEntity = {
      ...existing,
      ...partial,
      id, // protect id
      updatedAt: new Date(),
    };

    this.users.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    const existing = this.users.get(id);
    if (!existing) return false;

    this.emailIndex.delete(existing.email);
    this.usernameIndex.delete(existing.username);
    return this.users.delete(id);
  }

  public async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }

  public async searchUsers(
    criteria: UserSearchCriteria,
    skip = 0,
    limit = 20,
    sortBy: keyof UserEntity = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ users: UserEntity[]; total: number }> {
    let list = Array.from(this.users.values());

    if (criteria.role) {
      list = list.filter((u) => u.role === criteria.role);
    }

    if (criteria.status) {
      list = list.filter((u) => u.status === criteria.status);
    }

    if (criteria.search) {
      const s = criteria.search.toLowerCase();
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(s) ||
          u.username.toLowerCase().includes(s) ||
          u.firstName.toLowerCase().includes(s) ||
          u.lastName.toLowerCase().includes(s)
      );
    }

    if (criteria.createdAfter) {
      list = list.filter((u) => u.createdAt >= criteria.createdAfter!);
    }

    if (criteria.createdBefore) {
      list = list.filter((u) => u.createdAt <= criteria.createdBefore!);
    }

    const total = list.length;

    list.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA === undefined || valB === undefined) return 0;
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const paginated = list.slice(skip, skip + limit).map((u) => ({ ...u }));
    return { users: paginated, total };
  }

  public async updateStatus(userId: string, status: AccountStatusType): Promise<UserEntity | null> {
    return this.update(userId, { status });
  }

  public async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const updated = await this.update(userId, {
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date(),
    });
    return updated !== null;
  }

  public async updateLastLogin(userId: string, loginTime: Date): Promise<void> {
    await this.update(userId, { lastLoginAt: loginTime });
  }

  public clear(): void {
    this.users.clear();
    this.emailIndex.clear();
    this.usernameIndex.clear();
  }
}
