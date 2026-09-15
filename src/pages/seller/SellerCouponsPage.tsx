import React, { useState } from 'react';
import { Coupon } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Tag, Plus, Trash2, Edit3, CheckCircle2, Calendar } from 'lucide-react';

export const SellerCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: 'coup_1',
      code: 'AURA15',
      type: 'percentage',
      value: 15,
      minPurchase: 100,
      maxDiscount: 50,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      usageLimit: 500,
      usedCount: 142,
      isActive: true,
      sellerId: 'sel_1',
    },
    {
      id: 'coup_2',
      code: 'SUMMER50',
      type: 'fixed',
      value: 50,
      minPurchase: 300,
      startDate: '2026-06-01',
      endDate: '2026-08-31',
      usageLimit: 100,
      usedCount: 88,
      isActive: false,
      sellerId: 'sel_1',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(10);
  const [minSpend, setMinSpend] = useState(50);

  const handleCreateCoupon = () => {
    if (!code) return;
    const newCoupon: Coupon = {
      id: `coup_${Date.now()}`,
      code: code.toUpperCase(),
      type: discountType,
      value,
      minPurchase: minSpend,
      startDate: new Date().toISOString(),
      endDate: '2026-12-31',
      usageLimit: 200,
      usedCount: 0,
      isActive: true,
      sellerId: 'sel_1',
    };
    setCoupons([...coupons, newCoupon]);
    setIsModalOpen(false);
    setCode('');
  };

  const handleDelete = (id: string) => {
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Store Coupons & Vouchers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create custom promotional discount codes to incentivize store buyers.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Create Coupon
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <Card key={c.id} className="p-6 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <span className="font-mono font-black text-lg text-slate-900 dark:text-white tracking-wider">
                  {c.code}
                </span>
              </div>
              <Badge variant={c.isActive ? 'success' : 'secondary'} size="sm">
                {c.isActive ? 'Active' : 'Expired'}
              </Badge>
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <p className="text-base font-black text-indigo-600 dark:text-indigo-400">
                {c.type === 'percentage' ? `${c.value}% OFF` : `$${c.value} FLAT DISCOUNT`}
              </p>
              <p>Min Spend: <b>${c.minPurchase || 0}</b></p>
              <p>Usage: <b>{c.usedCount}</b> / {c.usageLimit} redeemed</p>
              <p className="text-[10px] text-slate-400 pt-1">
                Valid until: {new Date(c.endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(c.id)}
                className="text-xs text-rose-600 hover:text-rose-700 h-7"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Store Coupon"
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Coupon Code (e.g. FLASH20)"
            placeholder="PROMOCODE"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Dollar ($)</option>
              </select>
            </div>
            <Input
              label="Discount Value"
              type="number"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            />
          </div>

          <Input
            label="Minimum Order Spend ($)"
            type="number"
            value={minSpend}
            onChange={(e) => setMinSpend(parseFloat(e.target.value) || 0)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCoupon}>
              Create Coupon
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
