import React from 'react';
import { Product, ProductVariant } from '../../types';
import { Check } from 'lucide-react';

export interface VariantSelectorProps {
  product: Product;
  selectedAttributes: Record<string, string>;
  onAttributeChange: (attributeName: string, optionName: string) => void;
  matchedVariant?: ProductVariant;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  product,
  selectedAttributes,
  onAttributeChange,
  matchedVariant,
}) => {
  if (!product.attributes || product.attributes.length === 0) return null;

  return (
    <div className="space-y-5">
      {product.attributes.map((attr) => {
        const selectedValue = selectedAttributes[attr.name];

        return (
          <div key={attr.id} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-surface-900">
                {attr.name}: <span className="font-normal text-surface-600">{selectedValue}</span>
              </span>
            </div>

            {/* Color Swatches */}
            {attr.type === 'color' ? (
              <div className="flex flex-wrap items-center gap-2.5">
                {attr.options.map((opt) => {
                  const isSelected = selectedValue === opt.name;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onAttributeChange(attr.name, opt.name)}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-brand-600 ring-2 ring-brand-500/30 scale-110 shadow-sm'
                          : 'border-surface-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: opt.value }}
                      title={opt.name}
                    >
                      {isSelected && (
                        <Check
                          className={`h-4 w-4 drop-shadow-md ${
                            opt.value.toLowerCase() === '#ffffff' || opt.value.toLowerCase() === '#f3f2ee'
                              ? 'text-surface-900'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Size or Option Pills */
              <div className="flex flex-wrap items-center gap-2">
                {attr.options.map((opt) => {
                  const isSelected = selectedValue === opt.name;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onAttributeChange(attr.name, opt.name)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-surface-900 text-white shadow-sm ring-2 ring-surface-900/20'
                          : 'bg-surface-100 text-surface-700 hover:bg-surface-200 hover:text-surface-900'
                      }`}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {matchedVariant && (
        <div className="flex items-center gap-2 text-2xs text-surface-500 bg-surface-50 p-2.5 rounded-xl border border-surface-200">
          <span>SKU: <strong className="font-mono text-surface-800">{matchedVariant.sku}</strong></span>
          <span>•</span>
          <span>Stock: <strong className="text-surface-800">{matchedVariant.inventoryQuantity} units available</strong></span>
        </div>
      )}
    </div>
  );
};
