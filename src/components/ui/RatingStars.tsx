import React from 'react';
import { cn } from '../../utils/cn';
import { Star } from 'lucide-react';

export interface RatingStarsProps {
  rating: number; // 0 to 5
  maxRating?: number;
  reviewCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showText?: boolean;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  reviewCount,
  size = 'md',
  interactive = false,
  onRatingChange,
  showText = true,
  className,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const starSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    xs: 'text-2xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={cn('inline-flex items-center gap-1.5 select-none', className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, idx) => {
          const starValue = idx + 1;
          const isFilled = currentDisplayRating >= starValue;
          const isHalf = !isFilled && currentDisplayRating >= starValue - 0.5;

          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={cn(
                'p-0.5 transition-transform duration-100',
                interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              )}
            >
              <Star
                className={cn(
                  starSizes[size],
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-200 text-amber-400'
                    : 'fill-surface-200 text-surface-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {showText && (
        <span className={cn('font-semibold text-surface-800', textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span className={cn('text-surface-500', textSizes[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
};
