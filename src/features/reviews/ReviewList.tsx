import React, { useEffect, useState } from 'react';
import { ProductReview } from '../../types';
import { reviewService } from '../../services';
import { RatingStars } from '../../components/ui/RatingStars';
import { ThumbsUp, CheckCircle, Store, MessageSquare } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

export interface ReviewListProps {
  productId: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({ productId }) => {
  const { addToast } = useUiStore();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    reviewService.getProductReviews(productId, 1, 10).then((res) => {
      setReviews(res.data);
      setIsLoading(false);
    });
  }, [productId]);

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    try {
      const res = await reviewService.voteHelpful(reviewId, isHelpful);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, ...res.data } : r))
      );
      addToast({ type: 'info', title: 'Feedback Recorded', message: 'Thank you for your feedback!' });
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return <p className="text-xs text-surface-500 py-6 text-center">Loading customer reviews...</p>;
  }

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center text-surface-500 space-y-2">
        <MessageSquare className="h-8 w-8 text-surface-300 mx-auto" />
        <h5 className="text-sm font-bold text-surface-800">No reviews yet</h5>
        <p className="text-xs text-surface-500">Be the first verified customer to share your thoughts on this product!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-surface-100 space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="pt-6 first:pt-0 space-y-3">
          {/* User & Rating Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center overflow-hidden border border-brand-200">
                {review.userAvatar ? (
                  <img src={review.userAvatar} alt={review.userName} className="h-full w-full object-cover" />
                ) : (
                  review.userName.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-surface-900">{review.userName}</span>
                  {review.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-3xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle className="h-3 w-3" /> Verified Purchase
                    </span>
                  )}
                </div>
                <span className="text-3xs text-surface-400">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <RatingStars rating={review.rating} size="xs" showText={false} />
          </div>

          {/* Review Title & Comment */}
          <div className="space-y-1 pl-12">
            <h5 className="text-xs font-bold text-surface-900">{review.title}</h5>
            <p className="text-xs text-surface-600 leading-relaxed">{review.comment}</p>

            {/* Review Photos */}
            {review.images && review.images.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                {review.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Customer review uploaded photo"
                    className="h-16 w-16 rounded-xl object-cover border border-surface-200"
                  />
                ))}
              </div>
            )}

            {/* Seller Reply Bubble */}
            {review.sellerReply && (
              <div className="mt-4 rounded-2xl bg-surface-50 p-4 border border-surface-200 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-brand-700 font-bold text-2xs">
                  <Store className="h-3.5 w-3.5" />
                  <span>Seller Response ({review.sellerReply.authorName})</span>
                </div>
                <p className="text-surface-700 leading-relaxed">{review.sellerReply.content}</p>
              </div>
            )}

            {/* Helpful Vote Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-3xs text-surface-400">Was this review helpful?</span>
              <button
                type="button"
                onClick={() => handleVote(review.id, true)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-3xs font-semibold text-surface-600 hover:bg-surface-100 transition-colors"
              >
                <ThumbsUp className="h-3 w-3" />
                <span>Yes ({review.helpfulCount})</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
