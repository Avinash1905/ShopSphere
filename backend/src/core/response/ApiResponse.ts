/**
 * Standardized API Response Envelopes and Builders
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Response } from 'express';
import { HttpStatus, HttpStatusCode } from '../../config/constants';

export interface ResponseMeta {
  requestId?: string;
  correlationId?: string;
  timestamp: string;
  version?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: HttpStatusCode;
  message?: string;
  data: T;
  meta: ResponseMeta;
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  statusCode: HttpStatusCode;
  message?: string;
  data: T[];
  pagination: PaginationMeta;
  meta: ResponseMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
  path?: string;
  stack?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: HttpStatusCode;
  error: ApiErrorDetail;
  meta: ResponseMeta;
}

export class ResponseBuilder {
  public static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: HttpStatusCode = HttpStatus.OK,
    extraMeta?: Record<string, unknown>
  ): Response<ApiSuccessResponse<T>> {
    const requestId = (res.getHeader('x-request-id') as string) || (res.locals?.requestId as string);
    const correlationId = (res.getHeader('x-correlation-id') as string) || (res.locals?.correlationId as string);

    const payload: ApiSuccessResponse<T> = {
      success: true,
      statusCode,
      message,
      data,
      meta: {
        requestId,
        correlationId,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        ...extraMeta,
      },
    };

    return res.status(statusCode).json(payload);
  }

  public static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully',
    extraMeta?: Record<string, unknown>
  ): Response<ApiSuccessResponse<T>> {
    return this.success(res, data, message, HttpStatus.CREATED, extraMeta);
  }

  public static noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  public static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message?: string,
    extraMeta?: Record<string, unknown>
  ): Response<ApiPaginatedResponse<T>> {
    const requestId = (res.getHeader('x-request-id') as string) || (res.locals?.requestId as string);
    const correlationId = (res.getHeader('x-correlation-id') as string) || (res.locals?.correlationId as string);

    const payload: ApiPaginatedResponse<T> = {
      success: true,
      statusCode: HttpStatus.OK,
      message,
      data,
      pagination,
      meta: {
        requestId,
        correlationId,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        ...extraMeta,
      },
    };

    return res.status(HttpStatus.OK).json(payload);
  }

  public static error(
    res: Response,
    error: {
      code: string;
      message: string;
      details?: unknown;
      path?: string;
      stack?: string;
    },
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    extraMeta?: Record<string, unknown>
  ): Response<ApiErrorResponse> {
    const requestId = (res.getHeader('x-request-id') as string) || (res.locals?.requestId as string);
    const correlationId = (res.getHeader('x-correlation-id') as string) || (res.locals?.correlationId as string);
    const timestamp = new Date().toISOString();

    const payload: ApiErrorResponse = {
      success: false,
      statusCode,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        path: error.path,
        requestId,
        timestamp,
        stack: error.stack,
      },
      meta: {
        requestId,
        correlationId,
        timestamp,
        version: '1.0.0',
        ...extraMeta,
      },
    };

    return res.status(statusCode).json(payload);
  }
}
