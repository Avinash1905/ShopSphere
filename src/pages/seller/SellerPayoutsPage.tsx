import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  DollarSign,
  ArrowUpRight,
  Building2,
  Clock,
  CheckCircle2,
  Calendar,
  Download,
} from 'lucide-react';

interface PayoutTransaction {
  id: string;
  amount: number;
  bankAccount: string;
  date: string;
  status: 'completed' | 'processing' | 'failed';
}

export const SellerPayoutsPage: React.FC = () => {
  const [payouts, setPayouts] = useState<PayoutTransaction[]>([
    {
      id: 'PO-2026-089',
      amount: 14250.0,
      bankAccount: 'Chase Bank (•••• 7812)',
      date: '2026-10-15',
      status: 'completed',
    },
    {
      id: 'PO-2026-088',
      amount: 9800.5,
      bankAccount: 'Chase Bank (•••• 7812)',
      date: '2026-09-30',
      status: 'completed',
    },
    {
      id: 'PO-2026-087',
      amount: 11400.0,
      bankAccount: 'Chase Bank (•••• 7812)',
      date: '2026-09-15',
      status: 'completed',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('5000');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequestPayout = () => {
    setIsSuccess(true);
    setTimeout(() => {
      const newPO: PayoutTransaction = {
        id: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
        amount: parseFloat(withdrawAmount) || 5000,
        bankAccount: 'Chase Bank (•••• 7812)',
        date: new Date().toISOString().split('T')[0],
        status: 'processing',
      };
      setPayouts([newPO, ...payouts]);
      setIsSuccess(false);
      setIsModalOpen(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Payouts & Balances
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your store's settled earnings, escrow clearances, and automated bank wires.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 shrink-0 bg-emerald-600 hover:bg-emerald-700">
          <ArrowUpRight className="w-4 h-4" /> Request Payout
        </Button>
      </div>

      {/* Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white">
          <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider block">
            Available for Withdrawal
          </span>
          <h2 className="text-3xl font-black mt-1 font-mono">$18,420.50</h2>
          <p className="text-xs text-indigo-300 mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Settled & Ready for Transfer
          </p>
        </Card>

        <Card className="p-6">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Pending Escrow Clearance
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            $4,650.00
          </h2>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> 7-Day Buyer Protection Window
          </p>
        </Card>

        <Card className="p-6">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Lifetime Withdrawn
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            $105,450.00
          </h2>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Linked to JPMorgan Chase
          </p>
        </Card>
      </div>

      {/* Payout History Ledger */}
      <Card className="overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Payout History
          </h3>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <Download className="w-3.5 h-3.5" /> Download Tax Statement
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6 font-semibold">Reference ID</th>
                <th className="py-3.5 px-6 font-semibold">Initiated Date</th>
                <th className="py-3.5 px-6 font-semibold">Destination Bank</th>
                <th className="py-3.5 px-6 font-semibold">Amount</th>
                <th className="py-3.5 px-6 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payouts.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                    #{po.id}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    {po.date}
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300">
                    {po.bankAccount}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ${po.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge
                      variant={
                        po.status === 'completed'
                          ? 'success'
                          : po.status === 'processing'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {po.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payout Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Bank Wire Payout"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1 text-xs">
            <p><b>Primary Bank:</b> JPMorgan Chase (•••• 7812)</p>
            <p><b>Routing Number:</b> •••••0210</p>
            <p><b>Max Available:</b> $18,420.50</p>
          </div>

          <Input
            label="Withdrawal Amount ($)"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />

          {isSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Payout initiated! Funds will arrive in 1-2 business days.</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestPayout}>
              Confirm Wire Transfer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
