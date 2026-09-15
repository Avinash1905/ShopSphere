import React, { useEffect, useState } from 'react';
import { RatingBreakdown } from '../../types';
import { reviewService } from '../../services';
import { RatingStars } from '../../components/ui/RatingStars';
import { Star } from 'lucide-react';

export interface RatingBreakdownCardProps {
  productId: string;
}

export const RatingBreakdownCard: React.FC<RatingBreakdownCardProps> = ({ productId }) => {
  const [breakdown, setBreakdown] = useState<RatingBreakdown | null>(null);

  useEffect(() => {
    reviewService.getRatingBreakdown(productId).then((res) => {
      setBreakdown(res.data);
    });
  }, [productId]);

  if (!breakdown) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      {/* Overall Score */}
      <div className="flex flex-col items-center justify-center p-6 bg-surface-50 rounded-2xl border border-surface-200 min-w-[160px] text-center">
        <span className="text-4xl font-black text-surface-900 tracking-tight">
          {breakdown.averageRating.toFixed(1)}
        </span>
        <div className="my-2">
          <RatingStars rating={breakdown.averageRating} size="sm" showText={false} />
        </div>
        <span className="text-xs text-surface-500 font-medium">
          Based on {breakdown.totalReviews} {breakdown.totalReviews === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      {/* Breakdown Progress Bars */}
      <div className="flex-1 w-full space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = breakdown.counts[stars as 1 | 2 | 3 | 4 | 5] || 0;
          const percentage = breakdown.percentages[stars as 1 | 2 | 3 | 4 | 5] || 0;

          return (
            <div key={stars} className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 w-12 text-surface-700 font-semibold shrink-0">
                <span>{stars}</span>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </div>

              <div className="flex-1 h-2.5 bg-surface-100 rounded-full overflow-hidden border border-surface-200">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="w-10 text-right text-surface-500 font-mono text-2xs">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
