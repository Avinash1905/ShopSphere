/**
 * Request Context Manager using AsyncLocalStorage
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  requestId: string;
  correlationId: string;
  startTime: number;
  clientIp?: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextData>();

  public static run<R>(data: RequestContextData, callback: () => R): R {
    return this.storage.run(data, callback);
  }

  public static get(): RequestContextData | undefined {
    return this.storage.getStore();
  }

  public static getRequestId(): string {
    return this.storage.getStore()?.requestId || 'req-unknown';
  }

  public static getCorrelationId(): string {
    return this.storage.getStore()?.correlationId || this.getRequestId();
  }

  public static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  public static getRoles(): string[] {
    return this.storage.getStore()?.roles || [];
  }

  public static getPermissions(): string[] {
    return this.storage.getStore()?.permissions || [];
  }

  public static setUserId(userId: string, email?: string, roles: string[] = [], permissions: string[] = []): void {
    const store = this.storage.getStore();
    if (store) {
      store.userId = userId;
      if (email) store.email = email;
      store.roles = roles;
      store.permissions = permissions;
    }
  }

  public static setMetadata(key: string, value: unknown): void {
    const store = this.storage.getStore();
    if (store) {
      if (!store.metadata) {
        store.metadata = {};
      }
      store.metadata[key] = value;
    }
  }

  public static getMetadata<T = unknown>(key: string): T | undefined {
    const store = this.storage.getStore();
    return store?.metadata ? (store.metadata[key] as T) : undefined;
  }

  public static getElapsedMs(): number {
    const store = this.storage.getStore();
    if (!store) return 0;
    return Date.now() - store.startTime;
  }
}
