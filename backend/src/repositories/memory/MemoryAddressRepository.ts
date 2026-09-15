/**
 * In-Memory Address Repository Implementation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { IAddressRepository } from '../interfaces/IAddressRepository';
import { UserAddressEntity } from '../../users/users.types';
import { AddressTypeEnum } from '../../config/constants';
import { QueryFilter, QueryOptions } from '../interfaces/IBaseRepository';

export class MemoryAddressRepository implements IAddressRepository {
  private readonly addresses = new Map<string, UserAddressEntity>();

  public async findById(id: string): Promise<UserAddressEntity | null> {
    const a = this.addresses.get(id);
    return a ? { ...a } : null;
  }

  public async findByIdAndUserId(id: string, userId: string): Promise<UserAddressEntity | null> {
    const a = this.addresses.get(id);
    if (!a || a.userId !== userId) return null;
    return { ...a };
  }

  public async findByUserId(
    userId: string,
    skip = 0,
    limit = 20,
    type?: AddressTypeEnum
  ): Promise<{ addresses: UserAddressEntity[]; total: number }> {
    let list = Array.from(this.addresses.values()).filter((a) => a.userId === userId);

    if (type) {
      list = list.filter((a) => a.addressType === type);
    }

    // Default addresses first, then newest
    list.sort((a, b) => {
      if (a.isDefaultShipping && !b.isDefaultShipping) return -1;
      if (!a.isDefaultShipping && b.isDefaultShipping) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const total = list.length;
    const paginated = list.slice(skip, skip + limit).map((a) => ({ ...a }));

    return { addresses: paginated, total };
  }

  public async countByUserId(userId: string): Promise<number> {
    return Array.from(this.addresses.values()).filter((a) => a.userId === userId).length;
  }

  public async findDefaultShipping(userId: string): Promise<UserAddressEntity | null> {
    const a = Array.from(this.addresses.values()).find((addr) => addr.userId === userId && addr.isDefaultShipping);
    return a ? { ...a } : null;
  }

  public async findDefaultBilling(userId: string): Promise<UserAddressEntity | null> {
    const a = Array.from(this.addresses.values()).find((addr) => addr.userId === userId && addr.isDefaultBilling);
    return a ? { ...a } : null;
  }

  public async clearDefaultShipping(userId: string): Promise<void> {
    for (const [id, a] of this.addresses.entries()) {
      if (a.userId === userId && a.isDefaultShipping) {
        this.addresses.set(id, { ...a, isDefaultShipping: false, updatedAt: new Date() });
      }
    }
  }

  public async clearDefaultBilling(userId: string): Promise<void> {
    for (const [id, a] of this.addresses.entries()) {
      if (a.userId === userId && a.isDefaultBilling) {
        this.addresses.set(id, { ...a, isDefaultBilling: false, updatedAt: new Date() });
      }
    }
  }

  public async setDefaultShipping(id: string, userId: string): Promise<boolean> {
    const existing = await this.findByIdAndUserId(id, userId);
    if (!existing) return false;

    await this.clearDefaultShipping(userId);
    this.addresses.set(id, {
      ...existing,
      isDefaultShipping: true,
      updatedAt: new Date(),
    });
    return true;
  }

  public async setDefaultBilling(id: string, userId: string): Promise<boolean> {
    const existing = await this.findByIdAndUserId(id, userId);
    if (!existing) return false;

    await this.clearDefaultBilling(userId);
    this.addresses.set(id, {
      ...existing,
      isDefaultBilling: true,
      updatedAt: new Date(),
    });
    return true;
  }

  public async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const existing = await this.findByIdAndUserId(id, userId);
    if (!existing) return false;
    return this.addresses.delete(id);
  }

  public async findAll(filter?: QueryFilter<UserAddressEntity>, options?: QueryOptions<UserAddressEntity>): Promise<UserAddressEntity[]> {
    let result = Array.from(this.addresses.values());
    if (filter) {
      result = result.filter((a) => {
        for (const [key, expected] of Object.entries(filter)) {
          if (expected !== undefined && (a as any)[key] !== expected) {
            return false;
          }
        }
        return true;
      });
    }
    return result.map((a) => ({ ...a }));
  }

  public async count(filter?: QueryFilter<UserAddressEntity>): Promise<number> {
    const all = await this.findAll(filter);
    return all.length;
  }

  public async create(entity: UserAddressEntity): Promise<UserAddressEntity> {
    const id = entity.id || uuidv4();
    const now = new Date();

    // If this address is set as default, clear prior defaults for user
    if (entity.isDefaultShipping) {
      await this.clearDefaultShipping(entity.userId);
    }
    if (entity.isDefaultBilling) {
      await this.clearDefaultBilling(entity.userId);
    }

    const created: UserAddressEntity = {
      ...entity,
      id,
      createdAt: entity.createdAt || now,
      updatedAt: entity.updatedAt || now,
    };

    this.addresses.set(id, created);
    return { ...created };
  }

  public async update(id: string, partial: Partial<UserAddressEntity>): Promise<UserAddressEntity | null> {
    const existing = this.addresses.get(id);
    if (!existing) return null;

    if (partial.isDefaultShipping && !existing.isDefaultShipping) {
      await this.clearDefaultShipping(existing.userId);
    }
    if (partial.isDefaultBilling && !existing.isDefaultBilling) {
      await this.clearDefaultBilling(existing.userId);
    }

    const updated: UserAddressEntity = {
      ...existing,
      ...partial,
      id,
      userId: existing.userId, // immutable owner
      updatedAt: new Date(),
    };

    this.addresses.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    return this.addresses.delete(id);
  }

  public async exists(id: string): Promise<boolean> {
    return this.addresses.has(id);
  }

  public clear(): void {
    this.addresses.clear();
  }
}
