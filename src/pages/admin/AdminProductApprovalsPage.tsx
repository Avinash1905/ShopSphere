import React, { useState } from 'react';
import { Product } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PriceDisplay } from '../../components/ecommerce/PriceDisplay';
import {
  PackageCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Store,
  Tag,
  AlertTriangle,
} from 'lucide-react';

export const AdminProductApprovalsPage: React.FC = () => {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([
    {
      id: 'prod_mod_1',
      name: 'Cyberpunk OLED Smart Watch Ultra',
      brand: 'Nexus Tech',
      category: 'Electronics',
      categoryId: 'cat_electronics',
      price: 299.99,
      compareAtPrice: 349.99,
      stock: 50,
      sku: 'NEX-WTCH-01',
      sellerId: 'sel_3',
      sellerName: 'Nexus Tech Gadgets',
      rating: 0,
      reviewCount: 0,
      status: 'pending',
      images: [
        {
          id: 'img_1',
          url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
          alt: 'Smart Watch',
          isPrimary: true,
        },
      ],
      description: 'Futuristic smartwatch with blood oxygen monitoring and titanium build.',
      tags: ['smartwatch', 'oled', 'titanium'],
      specifications: { Screen: '1.92" OLED', Battery: '5 Days' },
      createdAt: '2026-10-24T00:00:00.000Z',
      updatedAt: '2026-10-24T00:00:00.000Z',
    },
    {
      id: 'prod_mod_2',
      name: 'Handcrafted Minimalist Walnut Coffee Table',
      brand: 'Nordic Craft',
      category: 'Home & Living',
      categoryId: 'cat_home',
      price: 450.00,
      stock: 12,
      sku: 'NC-TABL-02',
      sellerId: 'sel_2',
      sellerName: 'Nordic Craft Studio',
      rating: 0,
      reviewCount: 0,
      status: 'pending',
      images: [
        {
          id: 'img_2',
          url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600',
          alt: 'Table',
          isPrimary: true,
        },
      ],
      description: 'Solid American walnut coffee table with organic curves and natural oil finish.',
      tags: ['furniture', 'walnut', 'minimalist'],
      specifications: { Wood: 'Solid Walnut', Finish: 'Natural Tung Oil' },
      createdAt: '2026-10-24T00:00:00.000Z',
      updatedAt: '2026-10-24T00:00:00.000Z',
    },
  ]);

  const handleApprove = (id: string) => {
    setPendingProducts(pendingProducts.filter((p) => p.id !== id));
  };

  const handleReject = (id: string) => {
    setPendingProducts(pendingProducts.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Product Listing Moderation
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review new vendor submissions for authenticity, accurate pricing, and copyright compliance.
        </p>
      </div>

      {/* Grid of Listings */}
      <div className="space-y-4">
        {pendingProducts.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">All Listings Reviewed!</h3>
            <p className="text-xs text-slate-500 mt-1">No pending products waiting for publication approval.</p>
          </div>
        ) : (
          pendingProducts.map((p) => (
            <div
              key={p.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <img
                  src={p.images[0]?.url}
                  alt={p.name}
                  className="w-20 h-20 object-cover rounded-xl border border-slate-700 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{p.name}</h3>
                    <Badge variant="warning" size="sm">PENDING REVIEW</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Seller: <span className="font-semibold text-slate-200">{p.sellerName}</span> • Category: {p.category} • SKU: {p.sku}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="font-mono font-bold text-white text-sm">
                      ${p.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500">Stock: {p.stock} units</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleReject(p.id)}
                  className="gap-1.5 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(p.id)}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
