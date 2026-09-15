import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { useCartStore } from '../../store/cartStore';
import { Order, OrderStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PriceDisplay } from '../../components/ecommerce/PriceDisplay';
import {
  Package,
  Search,
  Truck,
  FileText,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Orders', value: 'all' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled / Returned', value: 'cancelled' },
];

export const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, fetchUserOrders, isLoading } = useOrderStore();
  const { addToCart } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!matchesSearch) return false;

    if (activeFilter === 'in_progress') {
      return ['placed', 'confirmed', 'processing', 'shipped'].includes(order.status);
    }
    if (activeFilter === 'delivered') {
      return order.status === 'delivered';
    }
    if (activeFilter === 'cancelled') {
      return ['cancelled', 'returned'].includes(order.status);
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'shipped':
        return <Badge variant="primary">In Transit</Badge>;
      case 'processing':
      case 'confirmed':
      case 'placed':
        return <Badge variant="warning">Processing</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'returned':
        return <Badge variant="secondary">Returned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addToCart(item.product, item.quantity, item.selectedVariant);
    });
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Order History
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Check the status of recent orders, manage returns, and download invoices.
            </p>
          </div>
          <Button onClick={() => navigate('/catalog')} className="gap-2 shrink-0">
            <ShoppingBag className="w-4 h-4" /> Start Shopping
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                  activeFilter === f.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <Input
              placeholder="Search by order ID or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* Order List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Package className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No orders found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              You have not placed any orders matching the current filter criteria.
            </p>
            <Button className="mt-5" onClick={() => navigate('/catalog')}>
              Explore Catalog
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Order Top Bar */}
                <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                        Order ID
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        #{order.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                        Date Placed
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">
                        Total Amount
                      </span>
                      <PriceDisplay price={order.total} size="sm" className="font-bold" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Items in Order */}
                <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.product.images[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <Link
                            to={`/product/${item.product.id}`}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Qty: <span className="font-medium text-slate-700 dark:text-slate-300">{item.quantity}</span> • Seller: {item.product.sellerName}
                          </p>
                          <PriceDisplay
                            price={(item.selectedVariant?.price || item.product.price) * item.quantity}
                            size="sm"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/product/${item.product.id}#reviews`)}
                          className="text-xs"
                        >
                          Write Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer Actions */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/order-tracking/${order.id}`)}
                      className="gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" /> Track Package
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/invoice/${order.id}`)}
                      className="gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> Invoice
                    </Button>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleReorder(order)}
                    className="gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Buy It Again
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
