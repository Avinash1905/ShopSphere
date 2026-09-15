import React, { useState } from 'react';
import { Order } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Truck, Package, Printer, CheckCircle2, QrCode } from 'lucide-react';

interface OrderFulfillmentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onFulfill: (orderId: string, carrier: string, trackingNumber: string) => void;
}

export const OrderFulfillmentModal: React.FC<OrderFulfillmentModalProps> = ({
  order,
  isOpen,
  onClose,
  onFulfill,
}) => {
  const [carrier, setCarrier] = useState('FedEx Express');
  const [trackingNumber, setTrackingNumber] = useState(
    `FDX-${Math.floor(100000000 + Math.random() * 900000000)}`
  );
  const [shippingNotes, setShippingNotes] = useState('Handle with care - fragile electronics.');
  const [isDone, setIsDone] = useState(false);

  if (!order) return null;

  const handleConfirmFulfillment = () => {
    setIsDone(true);
    setTimeout(() => {
      onFulfill(order.id, carrier, trackingNumber);
      setIsDone(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fulfill & Dispatch Order">
      <div className="space-y-4 pt-2">
        {/* Order Header Summary */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
              Order #{order.id}
            </span>
            <p className="text-xs text-slate-500">{order.shippingAddress.fullName}</p>
          </div>
          <Badge variant="primary" size="sm">
            {order.items.length} Item(s)
          </Badge>
        </div>

        {/* Carrier Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Shipping Courier
          </label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="FedEx Express">FedEx Express Air</option>
            <option value="UPS Ground">UPS Priority Ground</option>
            <option value="DHL VIP">DHL VIP International</option>
            <option value="USPS Priority">USPS Priority Mail</option>
          </select>
        </div>

        {/* Tracking Number */}
        <Input
          label="Tracking / Airway Bill (AWB) #"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
        />

        {/* Notes */}
        <Input
          label="Courier Dispatch Notes"
          value={shippingNotes}
          onChange={(e) => setShippingNotes(e.target.value)}
        />

        {/* Simulated Barcode Label */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Auto-Generated Label
              </span>
              <p className="text-[10px] text-slate-500 font-mono">{trackingNumber}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs h-8"
          >
            <Printer className="w-3.5 h-3.5" /> Print Label
          </Button>
        </div>

        {isDone && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Order marked as fulfilled! Customer notified.</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirmFulfillment} className="gap-1.5">
            <Truck className="w-4 h-4" /> Confirm & Dispatch
          </Button>
        </div>
      </div>
    </Modal>
  );
};
