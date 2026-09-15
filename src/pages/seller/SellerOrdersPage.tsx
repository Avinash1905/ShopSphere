import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerStore } from '../../store/sellerStore';
import { Order, OrderStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { OrderFulfillmentModal } from './OrderFulfillmentModal';
import {
  Search,
  Truck,
  FileText,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const SellerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, fetchSellerOrders, updateOrderStatus } = useSellerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [selectedOrderForFulfill, setSelectedOrderForFulfill] = useState<Order | null>(null);

  useEffect(() => {
    fetchSellerOrders();
  }, [fetchSellerOrders]);

  const filtered = orders.filter((ord) => {
    const matchesSearch =
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.shippingAddress?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeStatus === 'all') return matchesSearch;
    if (activeStatus === 'unfulfilled') {
      return ['placed', 'confirmed', 'processing'].includes(ord.status);
    }
    return ord.status === activeStatus && matchesSearch;
  });

  const handleFulfillSuccess = (orderId: string) => {
    updateOrderStatus(orderId, 'shipped');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success" size="sm">Delivered</Badge>;
      case 'shipped':
        return <Badge variant="primary" size="sm">Shipped</Badge>;
      case 'processing':
      case 'confirmed':
      case 'placed':
        return <Badge variant="warning" size="sm">Needs Fulfillment</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
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
            Order Fulfillment
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review incoming orders, print packing slips, and dispatch courier tracking numbers.
          </p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'unfulfilled', label: 'Unfulfilled' },
            { id: 'shipped', label: 'Shipped' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                activeStatus === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-72">
          <Input
            placeholder="Search by ID or customer..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Order ID</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Destination</th>
                <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No orders match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => {
                  const isUnfulfilled = ['placed', 'confirmed', 'processing'].includes(ord.status);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        #{ord.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {ord.shippingAddress.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {ord.shippingAddress.city}, {ord.shippingAddress.state}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        ${ord.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(ord.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUnfulfilled ? (
                            <Button
                              size="sm"
                              onClick={() => setSelectedOrderForFulfill(ord)}
                              className="gap-1 text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Truck className="w-3.5 h-3.5" /> Fulfill
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/order-tracking/${ord.id}`)}
                              className="gap-1 text-xs h-7"
                            >
                              Tracking
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/invoice/${ord.id}`)}
                            className="text-xs h-7 p-1.5"
                            title="Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Fulfillment Modal */}
      <OrderFulfillmentModal
        order={selectedOrderForFulfill}
        isOpen={!!selectedOrderForFulfill}
        onClose={() => setSelectedOrderForFulfill(null)}
        onFulfill={handleFulfillSuccess}
      />
    </div>
  );
};
