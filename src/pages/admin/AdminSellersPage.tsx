import React, { useState } from 'react';
import { Seller } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Star,
  ShieldCheck,
} from 'lucide-react';

export const AdminSellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([
    {
      id: 'sel_1',
      userId: 'usr_seller_1',
      storeName: 'Aura Sound Technologies Ltd.',
      slug: 'aura-sound',
      description: 'Official flagship boutique for audiophile acoustic headphones.',
      logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100',
      banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
      rating: 4.8,
      reviewCount: 342,
      isVerified: true,
      commissionRate: 10,
      totalSales: 128450.0,
      totalOrders: 1428,
      status: 'active',
      createdAt: '2024-01-10T00:00:00.000Z',
    },
    {
      id: 'sel_2',
      userId: 'usr_seller_2',
      storeName: 'Urban Mode Lifestyle',
      slug: 'urban-mode',
      description: 'Contemporary streetwear and minimalist wardrobe essentials.',
      logo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      rating: 4.6,
      reviewCount: 198,
      isVerified: true,
      commissionRate: 12,
      totalSales: 64200.0,
      totalOrders: 810,
      status: 'active',
      createdAt: '2024-03-22T00:00:00.000Z',
    },
    {
      id: 'sel_3',
      userId: 'usr_seller_3',
      storeName: 'Nexus Tech Gadgets',
      slug: 'nexus-tech',
      description: 'Cutting edge smart home electronics and productivity peripherals.',
      logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100',
      banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
      rating: 4.3,
      reviewCount: 84,
      isVerified: false,
      commissionRate: 15,
      totalSales: 18900.0,
      totalOrders: 240,
      status: 'suspended',
      createdAt: '2024-07-14T00:00:00.000Z',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSellerForFreeze, setSelectedSellerForFreeze] = useState<Seller | null>(null);

  const filtered = sellers.filter((s) =>
    s.storeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFreeze = (s: Seller) => {
    setSellers(
      sellers.map((item) =>
        item.id === s.id
          ? { ...item, status: item.status === 'active' ? 'suspended' : 'active' }
          : item
      )
    );
    setSelectedSellerForFreeze(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Seller Directory & Governance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor merchant sales volumes, commission rates, rating performance, and store compliance.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6 font-semibold">Merchant Store</th>
                <th className="py-3.5 px-6 font-semibold">Total GMV</th>
                <th className="py-3.5 px-6 font-semibold">Orders</th>
                <th className="py-3.5 px-6 font-semibold">Rating</th>
                <th className="py-3.5 px-6 font-semibold">Commission</th>
                <th className="py-3.5 px-6 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={s.logo}
                        alt={s.storeName}
                        className="w-10 h-10 object-cover rounded-xl border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">{s.storeName}</span>
                          {s.isVerified && (
                            <span title="Verified Merchant"><ShieldCheck className="w-4 h-4 text-emerald-400" /></span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: #{s.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-white text-sm">
                    ${(s.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-6 font-bold text-slate-300">
                    {s.totalOrders}
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{s.rating}</span>
                      <span className="text-slate-500 font-normal text-[10px]">({s.reviewCount})</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-indigo-400">
                    {s.commissionRate}%
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge variant={s.status === 'active' ? 'success' : 'danger'} size="sm">
                      {s.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSellerForFreeze(s)}
                        className={s.status === 'active' ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}
                      >
                        {s.status === 'active' ? 'Suspend Store' : 'Unsuspend'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Freeze / Suspend Modal */}
      <Modal
        isOpen={!!selectedSellerForFreeze}
        onClose={() => setSelectedSellerForFreeze(null)}
        title={selectedSellerForFreeze?.status === 'active' ? 'Suspend Vendor Storefront' : 'Reinstate Vendor Storefront'}
      >
        {selectedSellerForFreeze && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-300">
              Are you sure you want to {selectedSellerForFreeze.status === 'active' ? 'temporarily suspend' : 'reinstate'}{' '}
              <b>{selectedSellerForFreeze.storeName}</b>?
            </p>
            <p className="text-xs text-slate-400">
              {selectedSellerForFreeze.status === 'active'
                ? 'All live product listings will be delisted and checkout disabled.'
                : 'All listings will return to active search catalog visibility.'}
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setSelectedSellerForFreeze(null)}>
                Cancel
              </Button>
              <Button
                variant={selectedSellerForFreeze.status === 'active' ? 'danger' : 'primary'}
                onClick={() => handleToggleFreeze(selectedSellerForFreeze)}
              >
                Confirm {selectedSellerForFreeze.status === 'active' ? 'Suspension' : 'Reinstatement'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
