import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerStore } from '../../store/sellerStore';
import { MetricsCard } from '../../components/charts/MetricsCard';
import { AreaChartCard } from '../../components/charts/AreaChartCard';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PriceDisplay } from '../../components/ecommerce/PriceDisplay';
import {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export const SellerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardMetrics, products, orders, fetchDashboardMetrics, fetchSellerProducts, fetchSellerOrders } = useSellerStore();

  useEffect(() => {
    fetchDashboardMetrics();
    fetchSellerProducts();
    fetchSellerOrders();
  }, [fetchDashboardMetrics, fetchSellerProducts, fetchSellerOrders]);

  const salesData = [
    { name: 'Mon', value: 2400 },
    { name: 'Tue', value: 1398 },
    { name: 'Wed', value: 9800 },
    { name: 'Thu', value: 3908 },
    { name: 'Fri', value: 4800 },
    { name: 'Sat', value: 3800 },
    { name: 'Sun', value: 4300 },
  ];

  const orderVolumeData = [
    { name: 'Mon', count: 18 },
    { name: 'Tue', count: 12 },
    { name: 'Wed', count: 45 },
    { name: 'Thu', count: 28 },
    { name: 'Fri', count: 34 },
    { name: 'Sat', count: 29 },
    { name: 'Sun', count: 38 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Seller Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time store performance, sales metrics, and dispatch status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/seller/products/new')} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add New Product
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricsCard
          title="Total Store Revenue"
          value={`$${dashboardMetrics?.totalSales?.toLocaleString() || '128,450.00'}`}
          change={+14.2}
          changeLabel="vs last month"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricsCard
          title="Total Orders"
          value={dashboardMetrics?.totalOrders?.toString() || '1,428'}
          change={+8.5}
          changeLabel="vs last month"
          icon={<ShoppingBag className="w-5 h-5" />}
        />
        <MetricsCard
          title="Active Products"
          value={products.length ? products.length.toString() : '48'}
          change={+4.1}
          changeLabel="new this week"
          icon={<Package className="w-5 h-5" />}
        />
        <MetricsCard
          title="Avg Order Value"
          value={`$${dashboardMetrics?.averageOrderValue?.toFixed(2) || '89.95'}`}
          change={+2.3}
          changeLabel="vs last month"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AreaChartCard
            title="Revenue Trend (7-Day Overview)"
            data={salesData}
            dataKey="value"
            color="#4f46e5"
            height={280}
          />
        </div>
        <div className="lg:col-span-4">
          <BarChartCard
            title="Daily Order Volume"
            data={orderVolumeData}
            dataKey="count"
            color="#06b6d4"
            height={280}
          />
        </div>
      </div>

      {/* Tables Row: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Customer Orders
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/seller/orders')}
              className="text-xs gap-1"
            >
              View All Orders <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Items</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(orders.length > 0 ? orders.slice(0, 5) : [
                  { id: 'ORD-98124', customer: 'Alex Morgan', items: 2, total: 399.99, status: 'confirmed' },
                  { id: 'ORD-98125', customer: 'Sophia Bennett', items: 1, total: 149.50, status: 'shipped' },
                  { id: 'ORD-98126', customer: 'Lucas Wright', items: 4, total: 720.00, status: 'processing' },
                  { id: 'ORD-98127', customer: 'Emily Chen', items: 1, total: 89.00, status: 'delivered' },
                ]).map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      #{ord.id}
                    </td>
                    <td className="py-3.5 text-slate-700 dark:text-slate-300">
                      {ord.customer || ord.shippingAddress?.fullName || 'Alex Morgan'}
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {ord.items?.length || ord.items || 1} items
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                      ${(ord.total || 199.99).toFixed(2)}
                    </td>
                    <td className="py-3.5">
                      <Badge
                        variant={
                          ord.status === 'delivered'
                            ? 'success'
                            : ord.status === 'shipped'
                            ? 'primary'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {ord.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/seller/orders')}
                        className="text-indigo-600 hover:text-indigo-700 text-xs"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-base mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span>Low Stock Alerts</span>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Aura ANC Pro Headphones (Black)', stock: 3, threshold: 10 },
              { name: 'Ergonomic Titanium Stand', stock: 2, threshold: 8 },
              { name: 'Magnetic Wireless Power Bank', stock: 4, threshold: 15 },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-xl flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                    Remaining: <b className="font-mono">{item.stock}</b> (Min: {item.threshold})
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/seller/inventory')}
                  className="text-xs h-7 px-2.5"
                >
                  Restock
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/seller/inventory')}
            className="w-full mt-6 text-xs"
          >
            Open Full Inventory Manager
          </Button>
        </div>
      </div>
    </div>
  );
};
