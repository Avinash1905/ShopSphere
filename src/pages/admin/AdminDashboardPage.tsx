import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { MetricsCard } from '../../components/charts/MetricsCard';
import { AreaChartCard } from '../../components/charts/AreaChartCard';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { Button } from '../../components/common/Button';
import {
  DollarSign,
  Users,
  Store,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  Server,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchPlatformOverview } = useAdminStore();

  useEffect(() => {
    fetchPlatformOverview();
  }, [fetchPlatformOverview]);

  const gmvData = [
    { name: 'Jan', value: 450000 },
    { name: 'Feb', value: 520000 },
    { name: 'Mar', value: 610000 },
    { name: 'Apr', value: 580000 },
    { name: 'May', value: 740000 },
    { name: 'Jun', value: 890000 },
    { name: 'Jul', value: 1240000 },
  ];

  const categoryRevenue = [
    { name: 'Electronics', count: 485000 },
    { name: 'Fashion & Apparel', count: 320000 },
    { name: 'Home & Kitchen', count: 215000 },
    { name: 'Beauty & Wellness', count: 145000 },
    { name: 'Books & Media', count: 75000 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Platform Executive Control
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global Gross Merchandise Value (GMV), platform take-rate commission, and system health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>All Services Operational (99.98%)</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Platform GMV"
          value="$1,248,590.00"
          change={+22.4}
          changeLabel="vs last month"
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
        />
        <MetricsCard
          title="Commission Revenue (10%)"
          value="$124,859.00"
          change={+22.4}
          changeLabel="net platform fee"
          icon={<TrendingUp className="w-5 h-5 text-indigo-400" />}
        />
        <MetricsCard
          title="Registered Buyers"
          value="48,250"
          change={+14.8}
          changeLabel="+1.2k new this week"
          icon={<Users className="w-5 h-5 text-blue-400" />}
        />
        <MetricsCard
          title="Active Verified Sellers"
          value="1,420"
          change={+5.2}
          changeLabel="3 pending KYC"
          icon={<Store className="w-5 h-5 text-violet-400" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AreaChartCard
            title="Gross Merchandise Value Trend (2026)"
            data={gmvData}
            dataKey="value"
            color="#6366f1"
            height={280}
          />
        </div>
        <div className="lg:col-span-4">
          <BarChartCard
            title="GMV by Category Vertical"
            data={categoryRevenue}
            dataKey="count"
            color="#10b981"
            height={280}
          />
        </div>
      </div>

      {/* Tables Row: Pending KYC Approvals & System Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Sellers */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span>Pending Seller KYC Applications</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/seller-approvals')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Review All Queue <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-slate-800">
            {[
              { id: 'sel_app_1', name: 'Apex Audio Dynamics Ltd.', owner: 'James Wilson', type: 'Corporation', date: 'Oct 24, 2026' },
              { id: 'sel_app_2', name: 'Nordic Craft Studio', owner: 'Freja Lindqvist', type: 'Sole Proprietorship', date: 'Oct 23, 2026' },
              { id: 'sel_app_3', name: 'Lumina Tech Solutions', owner: 'Chen Wei', type: 'LLC', date: 'Oct 22, 2026' },
            ].map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{app.name}</h4>
                  <p className="text-xs text-slate-400">
                    Owner: {app.owner} • {app.type} • Applied {app.date}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/admin/seller-approvals')}
                  className="text-xs h-7 bg-indigo-600 hover:bg-indigo-700"
                >
                  Inspect KYC
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure Telemetry */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" /> System Telemetry
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Edge Gateway API</span>
              <span className="text-emerald-400 font-bold">24ms (Healthy)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Database Read Replicas</span>
              <span className="text-emerald-400 font-bold">3/3 Sync</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Redis Cache Hit Ratio</span>
              <span className="text-emerald-400 font-bold">96.4%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage Cluster</span>
              <span className="text-slate-300 font-mono">1.2 TB / 10 TB</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/audit-logs')}
              className="w-full text-xs text-slate-300 border-slate-700"
            >
              View System Audit Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
