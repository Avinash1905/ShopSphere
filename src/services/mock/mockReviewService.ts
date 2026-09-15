import { IReviewService, SubmitReviewParams } from '../api/reviewService';
import { mockStorage } from './mockStorage';
import {
  ProductReview,
  RatingBreakdown,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export class MockReviewService implements IReviewService {
  async getProductReviews(productId: string, page = 1, limit = 5): Promise<PaginatedResponse<ProductReview>> {
    await mockStorage.delay(150);
    const allReviews = mockStorage.getReviews();
    const productReviews = allReviews.filter((r) => r.productId === productId && r.status === 'published');

    const total = productReviews.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = productReviews.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getRatingBreakdown(productId: string): Promise<ApiResponse<RatingBreakdown>> {
    await mockStorage.delay(100);
    const allReviews = mockStorage.getReviews().filter((r) => r.productId === productId);
    const totalReviews = allReviews.length || 1;

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    allReviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[rounded]++;
      sum += r.rating;
    });

    const averageRating = allReviews.length > 0 ? Number((sum / allReviews.length).toFixed(1)) : 5.0;

    const percentages = {
      5: Math.round((counts[5] / totalReviews) * 100),
      4: Math.round((counts[4] / totalReviews) * 100),
      3: Math.round((counts[3] / totalReviews) * 100),
      2: Math.round((counts[2] / totalReviews) * 100),
      1: Math.round((counts[1] / totalReviews) * 100),
    };

    return {
      success: true,
      data: {
        averageRating,
        totalReviews: allReviews.length,
        counts,
        percentages,
      },
    };
  }

  async submitReview(params: SubmitReviewParams): Promise<ApiResponse<ProductReview>> {
    await mockStorage.delay(350);
    const users = mockStorage.getUsers();
    const currentUser = users[0]; // active customer

    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      productId: params.productId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userAvatar: currentUser.avatarUrl,
      rating: params.rating,
      title: params.title,
      comment: params.comment,
      images: params.images || [],
      isVerifiedPurchase: true,
      helpfulCount: 0,
      unhelpfulCount: 0,
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reviews = mockStorage.getReviews();
    reviews.unshift(newReview);
    mockStorage.saveReviews(reviews);

    return {
      success: true,
      data: newReview,
      message: 'Thank you! Your review has been published.',
    };
  }

  async voteHelpful(reviewId: string, isHelpful: boolean): Promise<ApiResponse<{ helpfulCount: number; unhelpfulCount: number }>> {
    await mockStorage.delay(100);
    const reviews = mockStorage.getReviews();
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error('Review not found');

    if (isHelpful) review.helpfulCount++;
    else review.unhelpfulCount++;

    mockStorage.saveReviews(reviews);
    return {
      success: true,
      data: { helpfulCount: review.helpfulCount, unhelpfulCount: review.unhelpfulCount },
    };
  }

  async replyToReview(reviewId: string, content: string): Promise<ApiResponse<ProductReview>> {
    await mockStorage.delay(250);
    const reviews = mockStorage.getReviews();
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error('Review not found');

    review.sellerReply = {
      id: `rep-${Date.now()}`,
      authorId: 'user-seller-1',
      authorName: 'TechVault Official',
      authorRole: 'seller',
      content,
      createdAt: new Date().toISOString(),
    };

    mockStorage.saveReviews(reviews);
    return { success: true, data: review, message: 'Reply posted successfully' };
  }
}

export const mockReviewService = new MockReviewService();
