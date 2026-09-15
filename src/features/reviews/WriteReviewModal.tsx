import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewFormSchema, ReviewFormData } from '../../schemas/reviewSchemas';
import { reviewService } from '../../services';
import { useUiStore } from '../../store/uiStore';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RatingStars } from '../../components/ui/RatingStars';
import { Star } from 'lucide-react';

export interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  onSuccess?: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle,
  onSuccess,
}) => {
  const { addToast } = useUiStore();
  const [rating, setRating] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      productId,
      rating: 5,
      title: '',
      comment: '',
      images: [],
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    setIsLoading(true);
    try {
      await reviewService.submitReview({
        productId,
        rating,
        title: data.title,
        comment: data.comment,
        images: data.images,
      });

      addToast({
        type: 'success',
        title: 'Review Submitted! 🌟',
        message: 'Thank you for helping fellow shoppers with your verified feedback.',
      });

      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Could not post review.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Write a Customer Review"
      description={`Share your experience with "${productTitle}"`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Star Rating Picker */}
        <div className="space-y-1.5 bg-surface-50 p-4 rounded-2xl border border-surface-200 text-center">
          <label className="block text-xs font-bold uppercase tracking-wider text-surface-700">
            Overall Rating
          </label>
          <div className="flex justify-center my-1">
            <RatingStars
              rating={rating}
              interactive={true}
              onRatingChange={(r) => setRating(r)}
              size="lg"
            />
          </div>
          <span className="text-2xs font-semibold text-surface-500">
            {rating === 5 ? 'Exceptional ⭐️⭐️⭐️⭐️⭐️' : rating === 4 ? 'Very Good ⭐️⭐️⭐️⭐️' : rating === 3 ? 'Average ⭐️⭐️⭐️' : rating === 2 ? 'Disappointing ⭐️⭐️' : 'Poor ⭐️'}
          </span>
        </div>

        <Input
          label="Headline / Title"
          placeholder="e.g. Best purchase I made all year!"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-sm font-medium text-surface-700">
            Written Review <span className="text-danger-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="What did you like or dislike? How was the build quality, performance, or fit?"
            className="w-full rounded-lg border border-surface-300 p-3 text-xs text-surface-900 placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('comment')}
          />
          {errors.comment && (
            <p className="text-xs text-danger-600 font-medium">{errors.comment.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="font-bold">
            Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};
