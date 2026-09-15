/**
 * In-Memory Session Repository Implementation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { ISessionRepository } from '../interfaces/ISessionRepository';
import { SessionEntity } from '../../auth/auth.types';
import { QueryFilter, QueryOptions } from '../interfaces/IBaseRepository';

export class MemorySessionRepository implements ISessionRepository {
  private readonly sessions = new Map<string, SessionEntity>();
  private readonly tokenHashIndex = new Map<string, string>(); // tokenHash -> sessionId

  public async findById(id: string): Promise<SessionEntity | null> {
    const s = this.sessions.get(id);
    return s ? { ...s } : null;
  }

  public async findByTokenHash(tokenHash: string): Promise<SessionEntity | null> {
    const id = this.tokenHashIndex.get(tokenHash);
    if (!id) return null;
    return this.findById(id);
  }

  public async findActiveByUserId(userId: string): Promise<SessionEntity[]> {
    const now = new Date();
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId && s.isActive && s.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((s) => ({ ...s }));
  }

  public async countActiveByUserId(userId: string): Promise<number> {
    const list = await this.findActiveByUserId(userId);
    return list.length;
  }

  public async findAll(filter?: QueryFilter<SessionEntity>, options?: QueryOptions<SessionEntity>): Promise<SessionEntity[]> {
    let result = Array.from(this.sessions.values());
    if (filter) {
      result = result.filter((s) => {
        for (const [key, expected] of Object.entries(filter)) {
          if (expected !== undefined && (s as any)[key] !== expected) {
            return false;
          }
        }
        return true;
      });
    }
    return result.map((s) => ({ ...s }));
  }

  public async count(filter?: QueryFilter<SessionEntity>): Promise<number> {
    const list = await this.findAll(filter);
    return list.length;
  }

  public async create(entity: SessionEntity): Promise<SessionEntity> {
    const id = entity.id || uuidv4();
    const now = new Date();
    const created: SessionEntity = {
      ...entity,
      id,
      createdAt: entity.createdAt || now,
      updatedAt: entity.updatedAt || now,
    };

    this.sessions.set(id, created);
    if (created.tokenHash) {
      this.tokenHashIndex.set(created.tokenHash, id);
    }

    return { ...created };
  }

  public async update(id: string, partial: Partial<SessionEntity>): Promise<SessionEntity | null> {
    const existing = this.sessions.get(id);
    if (!existing) return null;

    const updated: SessionEntity = {
      ...existing,
      ...partial,
      id,
      updatedAt: new Date(),
    };

    this.sessions.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    const s = this.sessions.get(id);
    if (!s) return false;
    this.tokenHashIndex.delete(s.tokenHash);
    return this.sessions.delete(id);
  }

  public async exists(id: string): Promise<boolean> {
    return this.sessions.has(id);
  }

  public async revokeSession(sessionId: string, reason = 'User requested logout'): Promise<boolean> {
    const existing = this.sessions.get(sessionId);
    if (!existing || !existing.isActive) return false;

    const updated: SessionEntity = {
      ...existing,
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason,
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, updated);
    return true;
  }

  public async revokeAllUserSessions(userId: string, reason = 'Revoked all user sessions'): Promise<number> {
    let count = 0;
    const now = new Date();

    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId && session.isActive) {
        this.sessions.set(id, {
          ...session,
          isActive: false,
          revokedAt: now,
          revokedReason: reason,
          updatedAt: now,
        });
        count++;
      }
    }

    return count;
  }

  public async revokeOtherUserSessions(userId: string, currentSessionId: string, reason = 'Revoked other sessions'): Promise<number> {
    let count = 0;
    const now = new Date();

    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId && session.id !== currentSessionId && session.isActive) {
        this.sessions.set(id, {
          ...session,
          isActive: false,
          revokedAt: now,
          revokedReason: reason,
          updatedAt: now,
        });
        count++;
      }
    }

    return count;
  }

  public async deleteExpiredSessions(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.tokenHashIndex.delete(session.tokenHash);
        this.sessions.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  public clear(): void {
    this.sessions.clear();
    this.tokenHashIndex.clear();
  }
}
