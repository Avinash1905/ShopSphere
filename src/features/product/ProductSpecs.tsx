import React from 'react';
import { ProductSpecification } from '../../types';

export interface ProductSpecsProps {
  specifications: ProductSpecification[];
}

export const ProductSpecs: React.FC<ProductSpecsProps> = ({ specifications }) => {
  if (!specifications || specifications.length === 0) {
    return <p className="text-xs text-surface-500 py-4">No technical specifications provided.</p>;
  }

  // Group specifications by group name
  const grouped: Record<string, ProductSpecification[]> = {};
  specifications.forEach((spec) => {
    const groupName = spec.group || 'General';
    if (!grouped[groupName]) grouped[groupName] = [];
    grouped[groupName].push(spec);
  });

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([groupName, specs]) => (
        <div key={groupName} className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-200 pb-2">
            {groupName} Specifications
          </h4>
          <div className="rounded-2xl border border-surface-200 bg-white overflow-hidden divide-y divide-surface-100">
            {specs.map((s, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs">
                <span className="font-semibold text-surface-600 sm:col-span-1">{s.key}</span>
                <span className="text-surface-900 font-medium sm:col-span-2 mt-1 sm:mt-0">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
