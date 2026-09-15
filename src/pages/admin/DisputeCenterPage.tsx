import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Scale,
} from 'lucide-react';

interface DisputeCase {
  id: string;
  orderId: string;
  buyerName: string;
  sellerName: string;
  claimAmount: number;
  reason: string;
  status: 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller';
  date: string;
  chatHistory: { sender: string; message: string; timestamp: string }[];
}

export const DisputeCenterPage: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeCase[]>([
    {
      id: 'DSP-2026-001',
      orderId: 'ORD-98124',
      buyerName: 'Alex Morgan',
      sellerName: 'Aura Sound Technologies',
      claimAmount: 399.99,
      reason: 'Seller rejected refund for item that arrived with broken hinge.',
      status: 'open',
      date: '2026-10-24',
      chatHistory: [
        { sender: 'Alex Morgan (Buyer)', message: 'The left headband hinge arrived snapped in half.', timestamp: '10:15 AM' },
        { sender: 'Aura Sound (Seller)', message: 'Our QA footage shows pristine packaging before carrier pickup.', timestamp: '11:20 AM' },
      ],
    },
  ]);

  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);

  const handleArbitrate = (id: string, resolution: 'resolved_buyer' | 'resolved_seller') => {
    setDisputes(
      disputes.map((d) => (d.id === id ? { ...d, status: resolution } : d))
    );
    setSelectedDispute(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Dispute & Arbitration Center
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Escalated buyer-seller transactional disputes requiring binding administrative arbitration.
        </p>
      </div>

      {/* List */}
      <div className="space-y-4">
        {disputes.map((dsp) => (
          <div
            key={dsp.id}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white">Case #{dsp.id}</h3>
                <Badge variant={dsp.status === 'open' ? 'danger' : 'success'} size="sm">
                  {dsp.status.toUpperCase()}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span>Order: <b className="text-white">#{dsp.orderId}</b></span>
                <span>•</span>
                <span>Buyer: <b className="text-slate-300">{dsp.buyerName}</b></span>
                <span>•</span>
                <span>Seller: <b className="text-slate-300">{dsp.sellerName}</b></span>
                <span>•</span>
                <span className="font-bold text-emerald-400">Claim: ${dsp.claimAmount.toFixed(2)}</span>
              </div>

              <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                "{dsp.reason}"
              </p>
            </div>

            <div className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDispute(dsp)}
                className="gap-1.5 text-xs text-slate-300 border-slate-700"
              >
                <Scale className="w-3.5 h-3.5" /> Arbitrate Case
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Arbitration Modal */}
      <Modal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title={`Arbitration Hearing #${selectedDispute?.id}`}
      >
        {selectedDispute && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1">
              <p><b>Dispute Claim:</b> ${selectedDispute.claimAmount.toFixed(2)}</p>
              <p><b>Order Reference:</b> #{selectedDispute.orderId}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Buyer / Seller Communication Transcript:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                {selectedDispute.chatHistory.map((msg, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <span className="font-bold text-indigo-400 text-[10px]">{msg.sender} ({msg.timestamp}):</span>
                    <p className="text-slate-300">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleArbitrate(selectedDispute.id, 'resolved_buyer')}
              >
                Rule for Buyer (Force Full Refund)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArbitrate(selectedDispute.id, 'resolved_seller')}
              >
                Rule for Seller (Dismiss Claim)
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
