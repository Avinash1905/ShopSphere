import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerStore } from '../../store/sellerStore';
import { Product } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { PriceDisplay } from '../../components/ecommerce/PriceDisplay';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  MoreVertical,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const SellerProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, fetchSellerProducts, deleteProduct, isLoading } = useSellerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSellerProducts();
  }, [fetchSellerProducts]);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product listing?')) {
      await deleteProduct(id);
    }
  };

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary" size="sm">Draft</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Under Review</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case 'archived':
        return <Badge variant="outline" size="sm">Archived</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Product Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your store's items, pricing, inventory stock, and listing approvals.
          </p>
        </div>
        <Button onClick={() => navigate('/seller/products/new')} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add New Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by title or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending Approval</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Categories</option>
            <option value="cat_electronics">Electronics</option>
            <option value="cat_fashion">Fashion</option>
            <option value="cat_home">Home & Living</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Product</th>
                <th className="py-3.5 px-4 font-semibold">SKU</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Price</th>
                <th className="py-3.5 px-4 font-semibold">Stock</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                            {p.name}
                          </p>
                          <span className="text-[10px] text-slate-400">{p.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                      {p.sku}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 capitalize">
                      {p.category}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'font-bold font-mono',
                          p.stock <= 5 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/product/${p.id}`)}
                          className="p-1.5 hover:text-indigo-600 text-slate-400 transition-colors"
                          title="View Live Listing"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/seller/products/edit/${p.id}`)}
                          className="p-1.5 hover:text-indigo-600 text-slate-400 transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 hover:text-rose-600 text-slate-400 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
