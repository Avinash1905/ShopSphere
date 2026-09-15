/**
 * Base Repository Interfaces and Query Criteria
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

export type QueryOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';

export interface FieldCriteria<T = unknown> {
  operator: QueryOperator;
  value: T;
}

export type QueryFilter<T> = {
  [K in keyof T]?: T[K] | FieldCriteria<T[K]>;
};

export interface QueryOptions<T> {
  skip?: number;
  limit?: number;
  sort?: { [K in keyof T]?: 'asc' | 'desc' };
}

export interface IBaseRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(filter?: QueryFilter<T>, options?: QueryOptions<T>): Promise<T[]>;
  count(filter?: QueryFilter<T>): Promise<number>;
  create(entity: T): Promise<T>;
  update(id: ID, partial: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  exists(id: ID): Promise<boolean>;
}
