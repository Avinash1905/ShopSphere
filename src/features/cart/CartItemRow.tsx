import React from 'react';
import { Link } from 'react-router-dom';
import { CartItem } from '../../types';
import { QuantitySelector } from '../../components/ui/QuantitySelector';
import { PriceDisplay } from '../../components/ui/PriceDisplay';
import { Trash2, Bookmark, AlertTriangle } from 'lucide-react';

export interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater: (id: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
}) => {
  const maxStock = item.variant ? item.variant.inventoryQuantity : item.product.totalInventory;
  const isLowStock = maxStock > 0 && maxStock <= 5;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-surface-200 bg-white shadow-2xs hover:shadow-sm transition-all">
      {/* Product Image & Info */}
      <div className="flex items-start gap-4">
        <Link to={`/product/${item.product.slug}`} className="shrink-0">
          <img
            src={item.product.images[0]?.url}
            alt={item.product.title}
            className="h-24 w-24 rounded-xl object-cover border border-surface-200 bg-surface-100"
          />
        </Link>
        <div className="space-y-1">
          <span className="text-3xs font-bold uppercase tracking-wider text-brand-600">
            {item.product.brand?.name}
          </span>
          <Link
            to={`/product/${item.product.slug}`}
            className="text-sm font-bold text-surface-900 hover:text-brand-600 transition-colors line-clamp-1 block"
          >
            {item.product.title}
          </Link>

          {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
            <div className="flex flex-wrap gap-2 text-2xs text-surface-500">
              {Object.entries(item.selectedAttributes).map(([key, val]) => (
                <span key={key} className="bg-surface-100 px-2 py-0.5 rounded-md font-medium">
                  {key}: {val}
                </span>
              ))}
            </div>
          )}

          {isLowStock && (
            <div className="flex items-center gap-1 text-3xs font-semibold text-amber-600 pt-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Only {maxStock} left in stock - order soon</span>
            </div>
          )}
        </div>
      </div>

      {/* Price, Quantity & Actions */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-surface-100">
        <PriceDisplay price={item.totalPrice} size="lg" />

        <div className="flex items-center gap-3">
          <QuantitySelector
            quantity={item.quantity}
            min={1}
            max={maxStock || 10}
            size="sm"
            onChange={(newQty) => onUpdateQuantity(item.id, newQty)}
          />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSaveForLater(item.id)}
              className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Save for Later"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
              title="Remove from Cart"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
