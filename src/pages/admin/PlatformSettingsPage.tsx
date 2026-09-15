import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Switch } from '../../components/common/Switch';
import { Badge } from '../../components/common/Badge';
import { Sliders, Shield, DollarSign, Server, CheckCircle2, Lock } from 'lucide-react';

export const PlatformSettingsPage: React.FC = () => {
  const [commissionRate, setCommissionRate] = useState(10);
  const [minPayout, setMinPayout] = useState(100);
  const [escrowDays, setEscrowDays] = useState(7);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Platform Governance & Global Config
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Adjust platform monetization take-rates, escrow clearance rules, and maintenance status.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Marketplace Monetization */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-400" /> Monetization & Take-Rates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Standard Commission Rate (%)"
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Minimum Payout Threshold ($)"
              type="number"
              value={minPayout}
              onChange={(e) => setMinPayout(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Escrow Hold Period (Days)"
              type="number"
              value={escrowDays}
              onChange={(e) => setEscrowDays(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Global Security & Maintenance */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" /> System Control & Registration
          </h2>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-white">Maintenance Mode</span>
              <p className="text-xs text-slate-400">
                Display maintenance splash screen to all non-admin visitors.
              </p>
            </div>
            <Switch checked={maintenanceMode} onChange={setMaintenanceMode} />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-white">Open Vendor Registrations</span>
              <p className="text-xs text-slate-400">
                Allow new sellers to submit self-serve onboarding applications.
              </p>
            </div>
            <Switch checked={allowRegistration} onChange={setAllowRegistration} />
          </div>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Platform configurations committed and distributed to edge nodes!</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="min-w-[180px]">
            Save Configurations
          </Button>
        </div>
      </form>
    </div>
  );
};
