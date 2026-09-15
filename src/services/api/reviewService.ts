import { httpClient } from './httpClient';
import {
  ProductReview,
  RatingBreakdown,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export interface SubmitReviewParams {
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export interface IReviewService {
  getProductReviews(productId: string, page?: number, limit?: number): Promise<PaginatedResponse<ProductReview>>;
  getRatingBreakdown(productId: string): Promise<ApiResponse<RatingBreakdown>>;
  submitReview(params: SubmitReviewParams): Promise<ApiResponse<ProductReview>>;
  voteHelpful(reviewId: string, isHelpful: boolean): Promise<ApiResponse<{ helpfulCount: number; unhelpfulCount: number }>>;
  replyToReview(reviewId: string, content: string): Promise<ApiResponse<ProductReview>>;
}

export class ApiReviewService implements IReviewService {
  async getProductReviews(productId: string, page = 1, limit = 5): Promise<PaginatedResponse<ProductReview>> {
    const res = await httpClient.get<any>(`/products/${productId}/reviews`, { page, limit });
    return res as unknown as PaginatedResponse<ProductReview>;
  }

  async getRatingBreakdown(productId: string): Promise<ApiResponse<RatingBreakdown>> {
    return httpClient.get<RatingBreakdown>(`/products/${productId}/rating-breakdown`);
  }

  async submitReview(params: SubmitReviewParams): Promise<ApiResponse<ProductReview>> {
    return httpClient.post<ProductReview>('/reviews', params);
  }

  async voteHelpful(reviewId: string, isHelpful: boolean): Promise<ApiResponse<{ helpfulCount: number; unhelpfulCount: number }>> {
    return httpClient.post<{ helpfulCount: number; unhelpfulCount: number }>(`/reviews/${reviewId}/vote`, { isHelpful });
  }

  async replyToReview(reviewId: string, content: string): Promise<ApiResponse<ProductReview>> {
    return httpClient.post<ProductReview>(`/reviews/${reviewId}/reply`, { content });
  }
}

export const apiReviewService = new ApiReviewService();
