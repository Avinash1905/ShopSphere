/**
 * Pagination Calculation and Utilities
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { PaginationMeta } from './ApiResponse';

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
  maxLimit?: number;
  defaultLimit?: number;
}

export interface NormalizedPagination {
  page: number;
  limit: number;
  offset: number;
}

export class PaginationHelper {
  public static normalize(params: PaginationParams = {}): NormalizedPagination {
    const maxLimit = params.maxLimit || 100;
    const defaultLimit = params.defaultLimit || 20;

    let page = typeof params.page === 'string' ? parseInt(params.page, 10) : params.page || 1;
    let limit = typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit || defaultLimit;

    if (isNaN(page) || page < 1) {
      page = 1;
    }

    if (isNaN(limit) || limit < 1) {
      limit = defaultLimit;
    } else if (limit > maxLimit) {
      limit = maxLimit;
    }

    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  public static buildMeta(totalItems: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);

    return {
      page: safePage,
      limit,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
      nextPage: safePage < totalPages ? safePage + 1 : null,
      prevPage: safePage > 1 ? safePage - 1 : null,
    };
  }

  public static paginateArray<T>(items: T[], page: number, limit: number): { data: T[]; meta: PaginationMeta } {
    const totalItems = items.length;
    const meta = this.buildMeta(totalItems, page, limit);
    const offset = (meta.page - 1) * limit;
    const data = items.slice(offset, offset + limit);

    return { data, meta };
  }
}
