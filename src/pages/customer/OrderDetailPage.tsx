import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { PriceDisplay } from '../../components/ecommerce/PriceDisplay';
import {
  ArrowLeft,
  Truck,
  CreditCard,
  MapPin,
  FileText,
  RotateCcw,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentOrder, getOrderById, cancelOrder, requestReturn, isLoading } = useOrderStore();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('defective');
  const [returnNotes, setReturnNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState<'original' | 'credit'>('original');

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId);
    }
  }, [orderId, getOrderById]);

  const order = currentOrder;

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const canCancel = ['placed', 'confirmed'].includes(order.status);
  const canReturn = order.status === 'delivered';

  const handleConfirmCancel = async () => {
    if (!orderId) return;
    await cancelOrder(orderId, cancelReason || 'Customer requested cancellation');
    setIsCancelModalOpen(false);
  };

  const handleConfirmReturn = async () => {
    if (!orderId) return;
    await requestReturn(orderId, `${returnReason}: ${returnNotes}`);
    setIsReturnModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Actions Top */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/order-tracking/${order.id}`)}
              className="gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" /> Track Package
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/invoice/${order.id}`)}
              className="gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> View Invoice
            </Button>
            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Order
              </Button>
            )}
            {canReturn && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsReturnModalOpen(true)}
                className="gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Return / Refund
              </Button>
            )}
          </div>
        </div>

        {/* Order Header Summary Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Order #{order.id}
                </h1>
                <Badge variant={order.status === 'delivered' ? 'success' : 'primary'}>
                  {order.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Order Total</span>
              <PriceDisplay price={order.total} size="xl" className="font-black" />
            </div>
          </div>

          {/* Delivery & Payment 3-column info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Delivery Address
              </h4>
              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
                <p className="font-semibold">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.street} {order.shippingAddress.apartment}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Phone: {order.shippingAddress.phone}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-500" /> Delivery Method
              </h4>
              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
                <p className="font-semibold">{order.shippingMethod?.name || 'Standard Shipping'}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  ETA: {order.shippingMethod?.estimatedDays || '3-5 business days'}
                </p>
                <p className="text-xs text-slate-500">Carrier: {order.shippingCarrier || order.shippingMethod?.carrier || 'FedEx Express'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Payment Info
              </h4>
              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
                <p className="font-semibold capitalize">{order.paymentMethod?.type || order.payment?.method || 'Card'} Payment</p>
                <p className="text-xs text-slate-500">
                  {order.paymentMethod?.details?.last4
                    ? `Ending in •••• ${order.paymentMethod.details.last4}`
                    : 'Verified Transaction'}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Paid & Settled
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Products */}
        <Card className="overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Ordered Items ({order.items.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 p-6">
            {order.items.map((item) => {
              const pTitle = item.product?.title || item.product?.name || item.productTitle || 'Product Item';
              const pImage = item.product?.images?.[0]?.url || item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120';
              const pSeller = item.product?.sellerName || item.sellerName || 'ShopSphere Seller';
              const pSku = item.product?.sku || item.sku || 'N/A';
              const itemPrice = item.selectedVariant?.price || item.variant?.price || item.product?.price || item.unitPrice || 0;

              return (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={pImage}
                      alt={pTitle}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <Link
                        to={item.product?.id ? `/product/${item.product.id}` : '#'}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors line-clamp-1"
                      >
                        {pTitle}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Seller: <span className="font-medium text-slate-700 dark:text-slate-300">{pSeller}</span> • SKU: {pSku}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Quantity: <span className="font-bold text-slate-700 dark:text-slate-300">{item.quantity}</span> × ${itemPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <PriceDisplay
                      price={itemPrice * item.quantity}
                      size="md"
                      className="font-bold"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown Summary */}
          <div className="bg-slate-50/60 dark:bg-slate-900/50 p-6 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-xs ml-auto space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {(order.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span>-${(order.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping Fee</span>
                <span>${(order.shippingFee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax</span>
                <span>${(order.tax || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center text-base font-black text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Cancellation Modal */}
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancel Order Confirmation"
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 rounded-xl text-sm border border-rose-200 dark:border-rose-900">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Are you sure you want to cancel?</p>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  This action is irreversible. A full refund of ${order.total.toFixed(2)} will be credited back to your payment method.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for cancellation
              </label>
              <Input
                placeholder="e.g. Ordered by mistake, found better price"
                value={cancelReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                Nevermind
              </Button>
              <Button variant="danger" onClick={handleConfirmCancel}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>

        {/* Return / Refund Modal */}
        <Modal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          title="Initiate Return / Replacement"
        >
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ShopSphere 30-Day Hassle-Free Return Policy guarantees a fast turnaround.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for Return
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="defective">Item arrived damaged / defective</option>
                <option value="wrong_item">Received wrong color / model</option>
                <option value="size_fit">Size / fit is not as expected</option>
                <option value="not_needed">No longer needed / changed mind</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Additional Comments / Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide details to expedite return verification..."
                value={returnNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReturnNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Refund Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRefundMethod('original')}
                  className={`p-3 text-left rounded-xl border text-xs font-semibold ${
                    refundMethod === 'original'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Original Payment Method
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">3-5 business days</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod('credit')}
                  className={`p-3 text-left rounded-xl border text-xs font-semibold ${
                    refundMethod === 'credit'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  ShopSphere Store Credit
                  <span className="block text-[10px] text-emerald-600 font-normal mt-0.5">Instant (+5% Bonus)</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmReturn}>
                Submit Return Request
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
