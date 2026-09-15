import React from 'react';
import { ShippingMethod } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Truck, Zap, Flame, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ShippingStepProps {
  selectedShippingId: string | null;
  onSelectShipping: (method: ShippingMethod) => void;
  onProceed: () => void;
  onBack: () => void;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'ship_standard',
    name: 'Standard Ground Delivery',
    description: 'Reliable parcel delivery straight to your doorstep.',
    price: 4.99,
    estimatedDays: '3-5 business days',
    carrier: 'USPS / FedEx Ground',
  },
  {
    id: 'ship_express',
    name: 'Expedited Priority Air',
    description: 'Fast air shipping for items you need urgently.',
    price: 14.99,
    estimatedDays: '2 business days',
    carrier: 'UPS Air Priority',
  },
  {
    id: 'ship_overnight',
    name: 'Overnight Express Rush',
    description: 'Guaranteed next-morning delivery before 12:00 PM.',
    price: 24.99,
    estimatedDays: '1 business day',
    carrier: 'DHL Express VIP',
  },
];

export const ShippingStep: React.FC<ShippingStepProps> = ({
  selectedShippingId,
  onSelectShipping,
  onProceed,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Shipping Method</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choose how quickly you would like your order to arrive.
        </p>
      </div>

      <div className="space-y-3">
        {SHIPPING_METHODS.map((method) => {
          const isSelected = selectedShippingId === method.id;
          return (
            <Card
              key={method.id}
              onClick={() => onSelectShipping(method)}
              className={cn(
                'p-4 sm:p-5 cursor-pointer transition-all border-2 flex items-center justify-between hover:border-indigo-400',
                isSelected
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                    method.id === 'ship_standard'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      : method.id === 'ship_express'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                  )}
                >
                  {method.id === 'ship_standard' ? (
                    <Truck className="w-5 h-5" />
                  ) : method.id === 'ship_express' ? (
                    <Zap className="w-5 h-5" />
                  ) : (
                    <Flame className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {method.name}
                    </h3>
                    {method.id === 'ship_express' && (
                      <Badge variant="primary" size="sm">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {method.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span>ETA: {method.estimatedDays}</span>
                    <span>•</span>
                    <span className="text-slate-400 dark:text-slate-500">{method.carrier}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-4">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  ${method.price.toFixed(2)}
                </span>
                <div className="mt-2 flex justify-end">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onBack}>
          Back to Address
        </Button>
        <Button size="lg" disabled={!selectedShippingId} onClick={onProceed}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};
