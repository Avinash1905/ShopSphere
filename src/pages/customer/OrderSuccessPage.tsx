import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PriceDisplay } from '../../components/ecommerce/PriceDisplay';
import {
  CheckCircle2,
  Package,
  Truck,
  FileText,
  ShoppingBag,
  Mail,
  Calendar,
  Clock,
} from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentOrder, getOrderById } = useOrderStore();

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId);
    }
  }, [orderId, getOrderById]);

  const order = currentOrder || {
    id: orderId || 'ORD-2026-98124',
    orderNumber: `SS-${(orderId || '98124').replace(/\D/g, '').slice(-6) || '98124'}`,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    items: [],
    shippingAddress: {
      fullName: 'Alex Morgan',
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postalCode: '97477',
      country: 'United States',
      phone: '+1 (555) 234-5678',
      type: 'home',
    },
    shippingMethod: {
      name: 'Expedited Priority Air',
      price: 14.99,
      estimatedDays: '2 business days',
    },
    paymentMethod: {
      type: 'card',
      details: { cardBrand: 'Visa', last4: '4242' },
    },
    subtotal: 399.98,
    discount: 40.0,
    tax: 28.8,
    shippingFee: 14.99,
    total: 403.77,
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Card Hero */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-6 ring-8 ring-emerald-50 dark:ring-emerald-950/20">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Thank you for your purchase!
          </h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your order has been placed and is currently being prepared for dispatch.
          </p>

          {/* Reference Meta Box */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-4 bg-slate-50 dark:bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400">Order Ref: </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{order.orderNumber || order.id}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>Confirmation emailed</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate(`/order-tracking/${order.id}`)}
              className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Truck className="w-4 h-4" /> Track Live Shipment
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(`/invoice/${order.id}`)}
              className="w-full sm:w-auto gap-2"
            >
              <FileText className="w-4 h-4" /> View Invoice
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/catalog')}
              className="w-full sm:w-auto gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Button>
          </div>
        </div>

        {/* Order Details Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Summary */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-indigo-600" /> Shipping Information
            </h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-white">
                {order.shippingAddress?.fullName}
              </p>
              <p>{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              <p className="text-xs text-slate-400 font-mono pt-1">
                Contact: {order.shippingAddress?.phone}
              </p>
            </div>
          </Card>

          {/* Payment & Delivery Summary */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-600" /> Payment & Delivery
            </h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3">
              <div>
                <span className="text-xs text-slate-400 block">Method:</span>
                <span className="font-medium text-slate-900 dark:text-white capitalize">
                  {((order as any).paymentMethod?.type || (order as any).payment?.method || (order as any).paymentMethod || 'Credit Card')} (•••• {((order as any).paymentMethod?.details?.last4 || '4242')})
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Delivery Option:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {order.shippingMethod?.name || 'Standard Ground'} ({order.shippingMethod?.estimatedDays || '3-5 days'})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-900 dark:text-white">Total Paid</span>
                <PriceDisplay price={order.total} size="lg" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
