import React, { useState, useEffect } from 'react';
import { useSellerStore } from '../../store/sellerStore';
import { Product } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Plus,
  Minus,
  AlertTriangle,
  Download,
  Edit2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const SellerInventoryPage: React.FC = () => {
  const { products, fetchSellerProducts, updateProductStock } = useSellerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStockVal, setNewStockVal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSellerProducts();
  }, [fetchSellerProducts]);

  const filtered = products.filter((p) => {
    const title = p.name || p.title || '';
    const stock = p.stock ?? p.totalInventory ?? 0;
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterLowStock) return matchesSearch && stock <= 10;
    return matchesSearch;
  });

  const handleOpenRestock = (product: Product) => {
    setSelectedProduct(product);
    setNewStockVal(product.stock ?? product.totalInventory ?? 0);
    setIsModalOpen(true);
  };

  const handleSaveStock = async () => {
    if (!selectedProduct) return;
    await updateProductStock(selectedProduct.id, newStockVal);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Inventory Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time stock level matrix, low inventory thresholds, and batch replenishment.
          </p>
        </div>
        <Button variant="outline" className="gap-1.5 shrink-0">
          <Download className="w-4 h-4" /> Export CSV Matrix
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by SKU or title..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border',
              filterLowStock
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock Only ({products.filter((p) => (p.stock ?? p.totalInventory ?? 0) <= 10).length})</span>
          </button>
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Product Title</th>
                <th className="py-3.5 px-4 font-semibold">SKU</th>
                <th className="py-3.5 px-4 font-semibold">Warehouse Location</th>
                <th className="py-3.5 px-4 font-semibold">In Stock</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p) => {
                const stockCount = p.stock ?? p.totalInventory ?? 0;
                const isLow = stockCount <= 10 && stockCount > 0;
                const isOutOfStock = stockCount === 0;
                const title = p.name || p.title;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'}
                          alt={title}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <span className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                          {title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                      {p.sku}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Aisle 04 / Bin {p.id.slice(-2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {stockCount}
                    </td>
                    <td className="py-3.5 px-4">
                      {isOutOfStock ? (
                        <Badge variant="danger" size="sm">Out of Stock</Badge>
                      ) : isLow ? (
                        <Badge variant="warning" size="sm">Low Stock</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Healthy</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRestock(p)}
                        className="gap-1.5 text-xs h-8"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Adjust Stock
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adjust Inventory Units"
      >
        {selectedProduct && (
          <div className="space-y-4 pt-2">
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedProduct.name || selectedProduct.title}
              </p>
              <p className="text-xs text-slate-400 font-mono">SKU: {selectedProduct.sku}</p>
            </div>

            <div className="flex items-center justify-center gap-4 py-4 bg-slate-50 dark:bg-slate-850 rounded-xl">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewStockVal(Math.max(0, newStockVal - 10))}
              >
                -10
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewStockVal(Math.max(0, newStockVal - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>

              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white w-20 text-center">
                {newStockVal}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewStockVal(newStockVal + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewStockVal(newStockVal + 10)}
              >
                +10
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStock}>
                Confirm Update
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
