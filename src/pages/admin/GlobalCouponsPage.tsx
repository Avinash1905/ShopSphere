import React, { useState } from 'react';
import { Coupon } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Plus, Trash2, Globe } from 'lucide-react';

export const GlobalCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: 'glob_1',
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minPurchase: 0,
      maxDiscount: 20,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      usageLimit: 10000,
      usedCount: 3840,
      isActive: true,
    },
    {
      id: 'glob_2',
      code: 'BLACKFRIDAY30',
      type: 'percentage',
      value: 30,
      minPurchase: 150,
      maxDiscount: 100,
      startDate: '2026-11-25',
      endDate: '2026-11-30',
      usageLimit: 5000,
      usedCount: 0,
      isActive: true,
    },
    {
      id: 'glob_3',
      code: 'FREESHIPGLOBAL',
      type: 'free_shipping',
      value: 0,
      minPurchase: 50,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      usageLimit: 50000,
      usedCount: 12450,
      isActive: true,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [value, setValue] = useState(10);
  const [minSpend, setMinSpend] = useState(0);

  const handleCreateCoupon = () => {
    if (!code) return;
    const newCoupon: Coupon = {
      id: `glob_${Date.now()}`,
      code: code.toUpperCase(),
      type: discountType,
      value: discountType === 'free_shipping' ? 0 : value,
      minPurchase: minSpend,
      startDate: new Date().toISOString(),
      endDate: '2026-12-31',
      usageLimit: 10000,
      usedCount: 0,
      isActive: true,
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Global Platform Promotions & Vouchers
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Site-wide promotional campaigns funded by platform marketing subsidies.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Create Global Coupon
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 relative"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <span className="font-mono font-black text-lg text-white tracking-wider">
                  {c.code}
                </span>
              </div>
              <Badge variant={c.isActive ? 'success' : 'secondary'} size="sm">
                {c.isActive ? 'ACTIVE' : 'EXPIRED'}
              </Badge>
            </div>

            <div className="space-y-1 text-xs text-slate-400">
              <p className="text-base font-black text-indigo-400">
                {c.type === 'free_shipping'
                  ? 'FREE GLOBAL SHIPPING'
                  : c.type === 'percentage'
                  ? `${c.value}% SITEWIDE OFF`
                  : `$${c.value} FLAT DISCOUNT`}
              </p>
              <p>Min Purchase: <b>${c.minPurchase || 0}</b></p>
              <p>Redemptions: <b>{(c.usedCount || c.timesUsed || 0).toLocaleString()}</b> / {(c.usageLimit || c.totalUsageLimit || 1000).toLocaleString()}</p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(c.id)}
                className="text-xs text-rose-400 hover:text-rose-300 h-7"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Campaign
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Global Site-Wide Coupon"
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Promo Code (e.g. FLASH30)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Discount Mode
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-900 text-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            {discountType !== 'free_shipping' && (
              <Input
                label="Value"
                type="number"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              />
            )}
          </div>

          <Input
            label="Minimum Cart Value ($)"
            type="number"
            value={minSpend}
            onChange={(e) => setMinSpend(parseFloat(e.target.value) || 0)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCoupon}>
              Deploy Campaign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
