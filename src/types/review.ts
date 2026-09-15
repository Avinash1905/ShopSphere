export type ReviewStatus = 'published' | 'pending_moderation' | 'flagged' | 'hidden';

export interface ReviewHelpfulVote {
  userId: string;
  isHelpful: boolean;
}

export interface ReviewReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'seller' | 'admin';
  content: string;
  createdAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productTitle?: string;
  productImage?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  status: ReviewStatus;
  sellerReply?: ReviewReply;
  createdAt: string;
  updatedAt: string;
}

export interface RatingBreakdown {
  averageRating: number;
  totalReviews: number;
  counts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  percentages: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
