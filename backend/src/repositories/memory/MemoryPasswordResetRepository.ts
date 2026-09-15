/**
 * In-Memory Password Reset Repository Implementation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { IPasswordResetRepository } from '../interfaces/IPasswordResetRepository';
import { PasswordResetEntity } from '../../auth/auth.types';
import { QueryFilter, QueryOptions } from '../interfaces/IBaseRepository';

export class MemoryPasswordResetRepository implements IPasswordResetRepository {
  private readonly resets = new Map<string, PasswordResetEntity>();
  private readonly hashIndex = new Map<string, string>(); // tokenHash -> id

  public async findById(id: string): Promise<PasswordResetEntity | null> {
    const r = this.resets.get(id);
    return r ? { ...r } : null;
  }

  public async findByTokenHash(tokenHash: string): Promise<PasswordResetEntity | null> {
    const id = this.hashIndex.get(tokenHash);
    if (!id) return null;
    return this.findById(id);
  }

  public async findLatestActiveByUserId(userId: string): Promise<PasswordResetEntity | null> {
    const now = new Date();
    const list = Array.from(this.resets.values())
      .filter((r) => r.userId === userId && !r.isUsed && r.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return list[0] ? { ...list[0] } : null;
  }

  public async markAsUsed(id: string): Promise<boolean> {
    const r = this.resets.get(id);
    if (!r || r.isUsed) return false;

    this.resets.set(id, {
      ...r,
      isUsed: true,
      usedAt: new Date(),
    });
    return true;
  }

  public async invalidateAllPendingForUser(userId: string): Promise<number> {
    let count = 0;
    for (const [id, r] of this.resets.entries()) {
      if (r.userId === userId && !r.isUsed) {
        this.resets.set(id, {
          ...r,
          isUsed: true,
        });
        count++;
      }
    }
    return count;
  }

  public async deleteExpiredTokens(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [id, r] of this.resets.entries()) {
      if (r.expiresAt <= now) {
        this.hashIndex.delete(r.tokenHash);
        this.resets.delete(id);
        count++;
      }
    }
    return count;
  }

  public async findAll(filter?: QueryFilter<PasswordResetEntity>, options?: QueryOptions<PasswordResetEntity>): Promise<PasswordResetEntity[]> {
    let result = Array.from(this.resets.values());
    if (filter) {
      result = result.filter((r) => {
        for (const [key, expected] of Object.entries(filter)) {
          if (expected !== undefined && (r as any)[key] !== expected) {
            return false;
          }
        }
        return true;
      });
    }
    return result.map((r) => ({ ...r }));
  }

  public async count(filter?: QueryFilter<PasswordResetEntity>): Promise<number> {
    const all = await this.findAll(filter);
    return all.length;
  }

  public async create(entity: PasswordResetEntity): Promise<PasswordResetEntity> {
    const id = entity.id || uuidv4();
    const now = new Date();
    const created: PasswordResetEntity = {
      ...entity,
      id,
      createdAt: entity.createdAt || now,
      isUsed: false,
    };

    this.resets.set(id, created);
    this.hashIndex.set(created.tokenHash, id);

    return { ...created };
  }

  public async update(id: string, partial: Partial<PasswordResetEntity>): Promise<PasswordResetEntity | null> {
    const existing = this.resets.get(id);
    if (!existing) return null;

    const updated: PasswordResetEntity = {
      ...existing,
      ...partial,
      id,
    };

    this.resets.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    const r = this.resets.get(id);
    if (!r) return false;
    this.hashIndex.delete(r.tokenHash);
    return this.resets.delete(id);
  }

  public async exists(id: string): Promise<boolean> {
    return this.resets.has(id);
  }

  public clear(): void {
    this.resets.clear();
    this.hashIndex.clear();
  }
}
