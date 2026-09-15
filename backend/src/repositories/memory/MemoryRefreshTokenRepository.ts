/**
 * In-Memory Refresh Token Repository Implementation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository';
import { RefreshTokenEntity } from '../../auth/auth.types';
import { QueryFilter, QueryOptions } from '../interfaces/IBaseRepository';

export class MemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly tokens = new Map<string, RefreshTokenEntity>();
  private readonly hashIndex = new Map<string, string>(); // tokenHash -> id

  public async findById(id: string): Promise<RefreshTokenEntity | null> {
    const t = this.tokens.get(id);
    return t ? { ...t } : null;
  }

  public async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const id = this.hashIndex.get(tokenHash);
    if (!id) return null;
    return this.findById(id);
  }

  public async findLatestActiveByUserId(userId: string): Promise<RefreshTokenEntity | null> {
    const now = new Date();
    const userTokens = Array.from(this.tokens.values())
      .filter((t) => t.userId === userId && !t.isRevoked && t.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userTokens[0] ? { ...userTokens[0] } : null;
  }

  public async findAll(filter?: QueryFilter<RefreshTokenEntity>, options?: QueryOptions<RefreshTokenEntity>): Promise<RefreshTokenEntity[]> {
    let result = Array.from(this.tokens.values());
    if (filter) {
      result = result.filter((t) => {
        for (const [key, expected] of Object.entries(filter)) {
          if (expected !== undefined && (t as any)[key] !== expected) {
            return false;
          }
        }
        return true;
      });
    }
    return result.map((t) => ({ ...t }));
  }

  public async count(filter?: QueryFilter<RefreshTokenEntity>): Promise<number> {
    const all = await this.findAll(filter);
    return all.length;
  }

  public async create(entity: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    const id = entity.id || uuidv4();
    const now = new Date();
    const created: RefreshTokenEntity = {
      ...entity,
      id,
      createdAt: entity.createdAt || now,
    };

    this.tokens.set(id, created);
    this.hashIndex.set(created.tokenHash, id);

    return { ...created };
  }

  public async update(id: string, partial: Partial<RefreshTokenEntity>): Promise<RefreshTokenEntity | null> {
    const existing = this.tokens.get(id);
    if (!existing) return null;

    const updated: RefreshTokenEntity = {
      ...existing,
      ...partial,
      id,
    };

    this.tokens.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    const existing = this.tokens.get(id);
    if (!existing) return false;
    this.hashIndex.delete(existing.tokenHash);
    return this.tokens.delete(id);
  }

  public async exists(id: string): Promise<boolean> {
    return this.tokens.has(id);
  }

  public async revokeToken(tokenHash: string, replacedByTokenHash?: string): Promise<boolean> {
    const id = this.hashIndex.get(tokenHash);
    if (!id) return false;

    const existing = this.tokens.get(id);
    if (!existing || existing.isRevoked) return false;

    this.tokens.set(id, {
      ...existing,
      isRevoked: true,
      usedAt: new Date(),
      replacedByTokenHash,
    });

    return true;
  }

  public async revokeTokenFamily(familyId: string): Promise<number> {
    let count = 0;
    for (const [id, token] of this.tokens.entries()) {
      if (token.familyId === familyId && !token.isRevoked) {
        this.tokens.set(id, {
          ...token,
          isRevoked: true,
        });
        count++;
      }
    }
    return count;
  }

  public async revokeAllForUser(userId: string): Promise<number> {
    let count = 0;
    for (const [id, token] of this.tokens.entries()) {
      if (token.userId === userId && !token.isRevoked) {
        this.tokens.set(id, {
          ...token,
          isRevoked: true,
        });
        count++;
      }
    }
    return count;
  }

  public async deleteExpiredTokens(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [id, token] of this.tokens.entries()) {
      if (token.expiresAt <= now) {
        this.hashIndex.delete(token.tokenHash);
        this.tokens.delete(id);
        count++;
      }
    }
    return count;
  }

  public clear(): void {
    this.tokens.clear();
    this.hashIndex.clear();
  }
}
