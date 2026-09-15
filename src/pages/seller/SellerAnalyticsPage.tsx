import React, { useState } from 'react';
import { AreaChartCard } from '../../components/charts/AreaChartCard';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { DonutChartCard } from '../../components/charts/DonutChartCard';
import { MetricsCard } from '../../components/charts/MetricsCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  TrendingUp,
  Users,
  Eye,
  Percent,
  Calendar,
  Download,
} from 'lucide-react';

export const SellerAnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const trafficData = [
    { name: 'Direct Search', value: 45 },
    { name: 'Category Browsing', value: 25 },
    { name: 'Promotions & Deals', value: 20 },
    { name: 'External Referrals', value: 10 },
  ];

  const conversionFunnel = [
    { name: 'Product Views', value: 18450 },
    { name: 'Added to Cart', value: 4200 },
    { name: 'Checkout Started', value: 2150 },
    { name: 'Orders Placed', value: 1428 },
  ];

  const revenueByChannel = [
    { name: 'Organic Marketplace', value: 78500 },
    { name: 'Featured Deals', value: 34200 },
    { name: 'Affiliate Links', value: 15750 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Performance Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Store traffic insights, customer conversion funnel, and category sales velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Year to Date</option>
          </select>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Store Page Impressions"
          value="48,290"
          change={+18.4}
          changeLabel="vs previous period"
          icon={<Eye className="w-5 h-5" />}
        />
        <MetricsCard
          title="Conversion Rate"
          value="3.24%"
          change={+0.6}
          changeLabel="industry benchmark: 2.1%"
          icon={<Percent className="w-5 h-5" />}
        />
        <MetricsCard
          title="Returning Customers"
          value="28.5%"
          change={+4.2}
          changeLabel="vs last month"
          icon={<Users className="w-5 h-5" />}
        />
        <MetricsCard
          title="Repeat Purchase Rate"
          value="19.8%"
          change={+1.5}
          changeLabel="healthy baseline"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <BarChartCard
            title="Conversion Funnel Step-Through"
            data={conversionFunnel}
            dataKey="value"
            color="#6366f1"
            height={280}
          />
        </div>
        <div className="lg:col-span-4">
          <DonutChartCard
            title="Customer Discovery Channels"
            data={trafficData}
            height={280}
          />
        </div>
      </div>

      {/* Revenue by Channel */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Revenue Breakdown by Sales Channel
        </h3>
        <div className="space-y-3">
          {revenueByChannel.map((ch, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">{ch.name}</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold">
                  ${ch.value.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${(ch.value / 128450) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
