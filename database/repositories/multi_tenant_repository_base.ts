/**
 * ShopSphere Database Repositories - Multi-Tenant Scoped Repository Base
 * Enforces tenant / seller boundary isolation on all reads, updates, and deletes
 */

import { BaseRepository, FindOptions, PaginatedResult } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface TenantContext {
  tenantId: string;
  tenantColumn?: string;
  enforceStrictIsolation?: boolean;
}

export class TenantIsolationViolationException extends Error {
  constructor(tenantId: string, entityTenantId: string, entityId: string) {
    super(
      `Tenant Isolation Violation: Active tenant '${tenantId}' is not authorized to access resource '${entityId}' belonging to tenant '${entityTenantId}'`
    );
    this.name = 'TenantIsolationViolationException';
  }
}

export abstract class MultiTenantRepository<T extends { id: string; [key: string]: any }> extends BaseRepository<T> {
  protected tenantContext: TenantContext;
  protected tenantColumn: string;

  constructor(tableName: string, db: MigrationDatabaseAdapter, tenantContext: TenantContext) {
    super(tableName, db);
    this.tenantContext = tenantContext;
    this.tenantColumn = tenantContext.tenantColumn || 'seller_id';
  }

  public getTenantId(): string {
    return this.tenantContext.tenantId;
  }

  public override async findById(id: string, options?: { forUpdate?: boolean }): Promise<T | null> {
    const entity = await super.findById(id, options);
    if (!entity) return null;

    const entityTenant = (entity as any)[this.tenantColumn];
    if (entityTenant && entityTenant !== this.tenantContext.tenantId) {
      if (this.tenantContext.enforceStrictIsolation !== false) {
        throw new TenantIsolationViolationException(this.tenantContext.tenantId, entityTenant, id);
      }
      return null;
    }
    return entity;
  }

  public override async findAll(options: FindOptions<T> = {}): Promise<PaginatedResult<T>> {
    // Inject tenant filter into where clause
    const tenantFilter = { field: this.tenantColumn, operator: 'EQ' as const, value: this.tenantContext.tenantId };
    let where = options.where;

    if (!where) {
      where = [tenantFilter];
    } else if (Array.isArray(where)) {
      where = [...where, tenantFilter];
    } else {
      where = { ...where, [this.tenantColumn]: this.tenantContext.tenantId };
    }

    return super.findAll({
      ...options,
      where,
    });
  }

  public override async create(entity: Partial<T>): Promise<T> {
    // Always bind tenant ID on insertion
    const scoped = {
      ...entity,
      [this.tenantColumn]: this.tenantContext.tenantId,
    };
    return super.create(scoped);
  }

  public override async update(id: string, updates: Partial<T>): Promise<T> {
    // Verify tenant ownership before updating
    await this.findById(id); // Will throw if cross-tenant
    const cleanUpdates = { ...updates };
    delete cleanUpdates[this.tenantColumn]; // Prevent changing tenant ownership
    return super.update(id, cleanUpdates);
  }

  public override async delete(id: string): Promise<boolean> {
    await this.findById(id); // Will throw if cross-tenant
    return super.delete(id);
  }
}
