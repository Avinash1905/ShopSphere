import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { PriceDisplay } from '../../components/ecommerce/PriceDisplay';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  productName: string;
  reason: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
}

export const SellerReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([
    {
      id: 'RET-001',
      orderId: 'ORD-98124',
      customerName: 'Alex Morgan',
      productName: 'Aura Wireless Headphones',
      reason: 'Audio distortion in left earcup during Bluetooth mode.',
      amount: 399.99,
      date: '2026-10-22',
      status: 'pending',
    },
    {
      id: 'RET-002',
      orderId: 'ORD-97990',
      customerName: 'Marcus Vance',
      productName: 'Titanium Stand',
      reason: 'Incorrect size ordered, requested swap for Pro model.',
      amount: 89.00,
      date: '2026-10-20',
      status: 'approved',
    },
  ]);

  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  const handleApprove = (id: string) => {
    setReturns(returns.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    setSelectedReturn(null);
  };

  const handleReject = (id: string) => {
    setReturns(returns.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
    setSelectedReturn(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Returns & Dispute Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review RMA authorizations, inspect claims, and issue customer refunds.
        </p>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">RMA ID</th>
                <th className="py-3.5 px-4 font-semibold">Order Ref</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Product</th>
                <th className="py-3.5 px-4 font-semibold">Refund Amount</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {returns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    #{r.id}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    #{r.orderId}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                    {r.customerName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {r.productName}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    ${r.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        r.status === 'approved'
                          ? 'success'
                          : r.status === 'pending'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {r.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReturn(r)}
                      className="text-xs h-7 gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect Return Modal */}
      <Modal
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title={`Return Claim #${selectedReturn?.id}`}
      >
        {selectedReturn && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1 text-xs">
              <p><b>Customer:</b> {selectedReturn.customerName}</p>
              <p><b>Order Ref:</b> #{selectedReturn.orderId}</p>
              <p><b>Product:</b> {selectedReturn.productName}</p>
              <p><b>Requested Refund:</b> ${selectedReturn.amount.toFixed(2)}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Customer Reason / Notes:
              </label>
              <p className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-900 dark:text-rose-200">
                "{selectedReturn.reason}"
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReject(selectedReturn.id)}
              >
                Reject Claim
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleApprove(selectedReturn.id)}
              >
                Approve & Issue Return Label
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
