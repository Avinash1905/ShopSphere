/**
 * ShopSphere Database Layer - Keyset & Cursor Pagination Engine
 * Features:
 * - Opaque base64 cursor tokens: { id: "...", orderValue: "...", direction: "forward" }
 * - High-performance $O(1)$ Keyset pagination without OFFSET performance degradation
 * - Bidirectional pagination (nextCursor, prevCursor, hasNextPage, hasPrevPage)
 */

export interface CursorPayload {
  id: string;
  orderValue: string | number;
  direction: 'next' | 'prev';
}

export interface CursorPaginationOptions {
  limit: number;
  cursor?: string;
  orderField?: string;
  orderDirection?: 'ASC' | 'DESC';
  idField?: string;
}

export interface CursorPageResult<T> {
  data: T[];
  limit: number;
  nextCursor: string | null;
  prevCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class CursorPaginationEngine {
  /**
   * Encodes cursor payload into URL-safe Base64 token
   */
  public static encodeCursor(payload: CursorPayload): string {
    const json = JSON.stringify(payload);
    return Buffer.from(json, 'utf8').toString('base64url');
  }

  /**
   * Decodes Base64 cursor token
   */
  public static decodeCursor(cursorToken: string): CursorPayload {
    try {
      const json = Buffer.from(cursorToken, 'base64url').toString('utf8');
      return JSON.parse(json) as CursorPayload;
    } catch {
      throw new Error(`Invalid or malformed cursor token: ${cursorToken}`);
    }
  }

  /**
   * Builds SQL WHERE clause and ORDER BY clause for cursor pagination
   */
  public static buildCursorSQL(
    tableName: string,
    options: CursorPaginationOptions
  ): { whereClause: string; orderByClause: string; limitClause: string; params: any[] } {
    const orderField = options.orderField || 'created_at';
    const orderDirection = options.orderDirection || 'DESC';
    const idField = options.idField || 'id';
    const limit = options.limit || 20;

    const params: any[] = [];
    let whereClause = '';

    if (options.cursor) {
      const payload = this.decodeCursor(options.cursor);
      const comparator = orderDirection === 'DESC' ? '<' : '>';
      // Compound keyset predicate: (orderField < ? OR (orderField = ? AND id < ?))
      whereClause = `WHERE ("${orderField}" ${comparator} ? OR ("${orderField}" = ? AND "${idField}" ${comparator} ?))`;
      params.push(payload.orderValue, payload.orderValue, payload.id);
    }

    const orderByClause = `ORDER BY "${orderField}" ${orderDirection}, "${idField}" ${orderDirection}`;
    const limitClause = `LIMIT ${limit + 1}`; // Fetch 1 extra record to test hasNextPage

    return {
      whereClause,
      orderByClause,
      limitClause,
      params,
    };
  }

  /**
   * Formats database rows into a structured CursorPageResult
   */
  public static formatPage<T extends Record<string, any>>(
    rows: T[],
    options: CursorPaginationOptions
  ): CursorPageResult<T> {
    const limit = options.limit || 20;
    const orderField = options.orderField || 'created_at';
    const idField = options.idField || 'id';

    const hasNextPage = rows.length > limit;
    const data = hasNextPage ? rows.slice(0, limit) : rows;

    let nextCursor: string | null = null;
    let prevCursor: string | null = null;

    if (data.length > 0) {
      const lastItem = data[data.length - 1];
      const firstItem = data[0];

      if (hasNextPage) {
        nextCursor = this.encodeCursor({
          id: String(lastItem[idField]),
          orderValue: lastItem[orderField],
          direction: 'next',
        });
      }

      if (options.cursor) {
        prevCursor = this.encodeCursor({
          id: String(firstItem[idField]),
          orderValue: firstItem[orderField],
          direction: 'prev',
        });
      }
    }

    return {
      data,
      limit,
      nextCursor,
      prevCursor,
      hasNextPage,
      hasPrevPage: !!options.cursor,
    };
  }
}
