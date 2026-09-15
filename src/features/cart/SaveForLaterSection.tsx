import React from 'react';
import { Link } from 'react-router-dom';
import { SavedForLaterItem } from '../../types';
import { PriceDisplay } from '../../components/ui/PriceDisplay';
import { ShoppingBag, Trash2, Bookmark } from 'lucide-react';

export interface SaveForLaterSectionProps {
  savedItems: SavedForLaterItem[];
  onMoveToCart: (id: string) => void;
  onRemoveSaved: (id: string) => void;
}

export const SaveForLaterSection: React.FC<SaveForLaterSectionProps> = ({
  savedItems,
  onMoveToCart,
  onRemoveSaved,
}) => {
  if (savedItems.length === 0) return null;

  return (
    <div className="space-y-4 pt-8 border-t border-surface-200">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-brand-600" />
        <h3 className="text-lg font-bold text-surface-900">
          Saved for Later ({savedItems.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {savedItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between p-4 rounded-2xl border border-surface-200 bg-white shadow-2xs space-y-3"
          >
            <div className="flex items-start gap-3">
              <img
                src={item.product.images[0]?.url}
                alt={item.product.title}
                className="h-16 w-16 rounded-xl object-cover border border-surface-200 bg-surface-100 shrink-0"
              />
              <div className="space-y-1">
                <Link
                  to={`/product/${item.product.slug}`}
                  className="text-xs font-bold text-surface-900 hover:text-brand-600 transition-colors line-clamp-2"
                >
                  {item.product.title}
                </Link>
                <PriceDisplay price={item.variant ? item.variant.price : item.product.price} size="sm" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-100">
              <button
                type="button"
                onClick={() => onMoveToCart(item.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Move to Cart</span>
              </button>

              <button
                type="button"
                onClick={() => onRemoveSaved(item.id)}
                className="p-1.5 text-surface-400 hover:text-danger-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
