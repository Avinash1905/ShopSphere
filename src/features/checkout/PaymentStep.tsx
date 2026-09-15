import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import {
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export type PaymentType = 'card' | 'upi' | 'netbanking' | 'cod';

interface PaymentStepProps {
  selectedPaymentMethod: any;
  onSelectPayment: (method: any) => void;
  onProceed: () => void;
  onBack: () => void;
  orderTotal: number;
}

const POPULAR_BANKS = [
  { id: 'chase', name: 'JPMorgan Chase' },
  { id: 'bofa', name: 'Bank of America' },
  { id: 'wells', name: 'Wells Fargo' },
  { id: 'citi', name: 'Citigroup' },
  { id: 'usbank', name: 'U.S. Bank' },
  { id: 'capitalone', name: 'Capital One' },
];

export const PaymentStep: React.FC<PaymentStepProps> = ({
  selectedPaymentMethod,
  onSelectPayment,
  onProceed,
  onBack,
  orderTotal,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentType>(
    selectedPaymentMethod?.type || 'card'
  );

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'amex' | 'unknown'>('unknown');
  const [saveCard, setSaveCard] = useState(true);

  // UPI State
  const [upiId, setUpiId] = useState('');
  const [upiMode, setUpiMode] = useState<'vpa' | 'qr'>('vpa');

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState('');

  // 3D Secure Simulation Modal
  const [show3DSModal, setShow3DSModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSeconds, setOtpSeconds] = useState(60);
  const [isSimulating3DS, setIsSimulating3DS] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');

  // Detect card brand
  useEffect(() => {
    const clean = cardNumber.replace(/\s+/g, '');
    if (clean.startsWith('4')) {
      setCardBrand('visa');
    } else if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) {
      setCardBrand('mastercard');
    } else if (/^3[47]/.test(clean)) {
      setCardBrand('amex');
    } else {
      setCardBrand('unknown');
    }
  }, [cardNumber]);

  // Format Card Number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiry
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setExpiry(val);
  };

  // 3DS OTP Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (show3DSModal && otpSeconds > 0) {
      timer = setInterval(() => setOtpSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [show3DSModal, otpSeconds]);

  const handleApplyCard = () => {
    if (!cardNumber || !cardHolder || !expiry || !cvv) return;
    const clean = cardNumber.replace(/\s+/g, '');
    const method: any = {
      id: `pm_${Date.now()}`,
      type: 'card',
      details: {
        cardBrand: cardBrand === 'unknown' ? 'Visa' : cardBrand.toUpperCase(),
        last4: clean.slice(-4),
        expiryMonth: parseInt(expiry.split('/')[0]) || 12,
        expiryYear: parseInt(expiry.split('/')[1]) || 28,
        holderName: cardHolder,
      },
    };
    onSelectPayment(method);
    // Trigger 3DS Simulation Modal for realistic demo experience
    setShow3DSModal(true);
    setSimulationStatus('idle');
    setOtpSeconds(60);
    setOtpValue('123456');
  };

  const handleVerify3DS = () => {
    setIsSimulating3DS(true);
    setSimulationStatus('verifying');
    setTimeout(() => {
      setIsSimulating3DS(false);
      setSimulationStatus('success');
      setTimeout(() => {
        setShow3DSModal(false);
        onProceed();
      }, 1200);
    }, 1500);
  };

  const handleApplyUPI = () => {
    const method: any = {
      id: `pm_upi_${Date.now()}`,
      type: 'upi',
      details: {
        upiId: upiMode === 'vpa' ? upiId : 'merchant.qr@shopsphere',
      },
    };
    onSelectPayment(method);
    onProceed();
  };

  const handleApplyNetbanking = () => {
    if (!selectedBank) return;
    const bankName = POPULAR_BANKS.find((b) => b.id === selectedBank)?.name || selectedBank;
    const method: any = {
      id: `pm_nb_${Date.now()}`,
      type: 'netbanking',
      details: {
        bankName,
      },
    };
    onSelectPayment(method);
    onProceed();
  };

  const handleApplyCOD = () => {
    const method: any = {
      id: `pm_cod_${Date.now()}`,
      type: 'cod',
      details: {},
    };
    onSelectPayment(method);
    onProceed();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment Method</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          All transactions are secured and 256-bit SSL encrypted.
        </p>
      </div>

      {/* Payment Modes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
          { id: 'upi', label: 'UPI / QR Code', icon: QrCode },
          { id: 'netbanking', label: 'Net Banking', icon: Building2 },
          { id: 'cod', label: 'Cash on Delivery', icon: Banknote },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as PaymentType)}
              className={cn(
                'p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-center transition-all',
                isActive
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode Content */}
      <Card className="p-6">
        {activeTab === 'card' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Enter Card Details
              </span>
              <div className="flex items-center gap-1.5">
                <Badge variant={cardBrand === 'visa' ? 'primary' : 'outline'} size="sm">
                  Visa
                </Badge>
                <Badge variant={cardBrand === 'mastercard' ? 'primary' : 'outline'} size="sm">
                  Mastercard
                </Badge>
                <Badge variant={cardBrand === 'amex' ? 'primary' : 'outline'} size="sm">
                  Amex
                </Badge>
              </div>
            </div>

            <Input
              label="Cardholder Name"
              placeholder="e.g. Alex Morgan"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
            />

            <Input
              label="Card Number"
              placeholder="4000 1234 5678 9010"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiration Date"
                placeholder="MM/YY"
                value={expiry}
                onChange={handleExpiryChange}
                maxLength={5}
              />
              <Input
                label="CVV / CVC"
                placeholder="123"
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.slice(0, 4))}
                maxLength={4}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Save card securely for faster checkout in future
              </span>
            </label>

            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                disabled={!cardNumber || !cardHolder || !expiry || !cvv}
                onClick={handleApplyCard}
              >
                Proceed with Card
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'upi' && (
          <div className="space-y-5">
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setUpiMode('vpa')}
                className={cn(
                  'text-sm font-semibold pb-1 transition-colors relative',
                  upiMode === 'vpa'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                Virtual Payment Address (VPA)
              </button>
              <button
                type="button"
                onClick={() => setUpiMode('qr')}
                className={cn(
                  'text-sm font-semibold pb-1 transition-colors relative',
                  upiMode === 'qr'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                Scan QR Code
              </button>
            </div>

            {upiMode === 'vpa' ? (
              <div className="space-y-4">
                <Input
                  label="UPI ID / VPA"
                  placeholder="username@okhdfcbank or user@oksbi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  A payment request will be sent to your UPI mobile app (Google Pay, PhonePe, Paytm).
                </p>
                <div className="flex justify-end pt-2">
                  <Button
                    size="lg"
                    disabled={!upiId || !upiId.includes('@')}
                    onClick={handleApplyUPI}
                  >
                    Verify & Continue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-4 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-500 rounded-2xl shadow-inner">
                  {/* Simulated QR Code */}
                  <div className="w-48 h-48 bg-slate-900 flex items-center justify-center rounded-lg relative overflow-hidden">
                    <QrCode className="w-40 h-40 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Scan with any UPI App to pay ${orderTotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    GPay, PhonePe, Paytm, BHIM or Mobile Banking
                  </p>
                </div>
                <Button
                  onClick={handleApplyUPI}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simulate QR Scan & Pay
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'netbanking' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Select Your Financial Institution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {POPULAR_BANKS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBank(b.id)}
                  className={cn(
                    'p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between',
                    selectedBank === b.id
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  )}
                >
                  <span>{b.name}</span>
                  {selectedBank === b.id && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button size="lg" disabled={!selectedBank} onClick={handleApplyNetbanking}>
                Proceed to Net Banking
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'cod' && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
              <Banknote className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Pay upon package receipt</span>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Please keep exact change ready. A small convenience fee of $2.00 may apply for cash handling.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="lg" onClick={handleApplyCOD}>
                Confirm Cash on Delivery
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>
          Back to Shipping
        </Button>
      </div>

      {/* 3D Secure Verification Simulation Modal */}
      <Modal
        isOpen={show3DSModal}
        onClose={() => setShow3DSModal(false)}
        title="3D Secure 2.0 Card Verification"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Verified by {cardBrand.toUpperCase()} SafeKey
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              ${orderTotal.toFixed(2)}
            </span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            A 6-digit one-time passcode has been dispatched to your mobile device ending in <b>**78</b>.
          </p>

          <div className="space-y-2">
            <Input
              label="Enter OTP Code (Simulated: 123456)"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              maxLength={6}
              className="text-center font-mono text-lg tracking-widest"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Expires in {otpSeconds}s</span>
              <button
                type="button"
                onClick={() => setOtpSeconds(60)}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </div>

          {simulationStatus === 'success' && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Authentication Successful! Finalizing authorization...</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShow3DSModal(false)}
              disabled={isSimulating3DS}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify3DS}
              isLoading={isSimulating3DS}
              disabled={otpValue.length < 4}
            >
              Authorize Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
