import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { Button } from '../../components/common/Button';
import { PriceDisplay } from '../../components/ecommerce/PriceDisplay';
import {
  Printer,
  Download,
  Share2,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const InvoicePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentOrder, getOrderById } = useOrderStore();
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId);
    }
  }, [orderId, getOrderById]);

  const order = currentOrder || {
    id: orderId || 'ORD-2026-98124',
    createdAt: new Date().toISOString(),
    status: 'delivered',
    items: [
      {
        id: 'item_1',
        productId: 'prod_1',
        quantity: 1,
        unitPrice: 399.99,
        totalPrice: 399.99,
        product: {
          id: 'prod_1',
          name: 'ShopSphere Aura Wireless ANC Headphones',
          sku: 'SS-AUD-001',
          sellerName: 'Aura Sound Technologies Ltd.',
        },
      },
    ],
    shippingAddress: {
      fullName: 'Alex Morgan',
      street: '742 Evergreen Terrace',
      apartment: 'Apt 4B',
      city: 'Springfield',
      state: 'OR',
      postalCode: '97477',
      country: 'United States',
      phone: '+1 (555) 234-5678',
    },
    billingAddress: {
      fullName: 'Alex Morgan',
      street: '742 Evergreen Terrace',
      apartment: 'Apt 4B',
      city: 'Springfield',
      state: 'OR',
      postalCode: '97477',
      country: 'United States',
      phone: '+1 (555) 234-5678',
    },
    paymentMethod: {
      type: 'card',
      details: { cardBrand: 'Visa', last4: '4242' },
    },
    subtotal: 399.99,
    discount: 40.0,
    tax: 28.8,
    shippingFee: 14.99,
    total: 403.78,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Action Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          to={`/orders/${order.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print Invoice
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div
        ref={invoiceRef}
        className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-black text-2xl tracking-tight">
              <ShoppingBag className="w-7 h-7" />
              <span>ShopSphere</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              ShopSphere Global Commerce Inc.<br />
              100 Tech Hub Boulevard, Suite 500<br />
              San Francisco, CA 94105, USA<br />
              Tax / EIN: XX-XXXXXXX98
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block mb-2">
              Official Tax Invoice
            </span>
            <h2 className="text-xl font-mono font-bold text-slate-900">
              INV-{order.id}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Date: <span className="font-medium text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</span>
            </p>
            <p className="text-xs text-slate-500">
              Payment Ref: <span className="font-mono text-slate-700">TXN-{order.id.replace(/\D/g, '') || '98762'}</span>
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To:
            </span>
            <p className="font-bold text-slate-900 text-sm">{order.billingAddress?.fullName || order.shippingAddress.fullName}</p>
            <p className="text-slate-600 mt-0.5">{order.billingAddress?.street || order.shippingAddress.street}</p>
            <p className="text-slate-600">
              {order.billingAddress?.city || order.shippingAddress.city}, {order.billingAddress?.state || order.shippingAddress.state} {order.billingAddress?.postalCode || order.shippingAddress.postalCode}
            </p>
            <p className="text-slate-600">{order.billingAddress?.country || order.shippingAddress.country}</p>
            <p className="text-slate-500 font-mono mt-1">Phone: {order.billingAddress?.phone || order.shippingAddress.phone}</p>
          </div>

          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Shipped To:
            </span>
            <p className="font-bold text-slate-900 text-sm">{order.shippingAddress.fullName}</p>
            <p className="text-slate-600 mt-0.5">{order.shippingAddress.street} {order.shippingAddress.apartment}</p>
            <p className="text-slate-600">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p className="text-slate-600">{order.shippingAddress.country}</p>
            <p className="text-slate-500 font-mono mt-1">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 font-bold">#</th>
                <th className="py-3 font-bold">Item Description</th>
                <th className="py-3 font-bold">SKU</th>
                <th className="py-3 font-bold text-right">Unit Price</th>
                <th className="py-3 font-bold text-center">Qty</th>
                <th className="py-3 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="py-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 pr-4">
                    <p className="font-bold text-slate-900">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sold by: {item.product.sellerName}</p>
                  </td>
                  <td className="py-3 font-mono text-slate-500">{item.product.sku || 'N/A'}</td>
                  <td className="py-3 text-right font-mono">${(item.selectedVariant?.price || item.product.price || item.unitPrice || 0).toFixed(2)}</td>
                  <td className="py-3 text-center font-bold">{item.quantity}</td>
                  <td className="py-3 text-right font-bold font-mono">
                    ${((item.selectedVariant?.price || item.product.price || item.unitPrice || 0) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="border-t border-slate-200 pt-4 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span className="font-mono">-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping & Handling</span>
              <span className="font-mono">${order.shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Sales Tax (8%)</span>
              <span className="font-mono">${order.tax.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-black text-sm text-slate-900">
              <span>Grand Total</span>
              <span className="font-mono text-base">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">Thank you for choosing ShopSphere!</p>
            <p>For questions or support, visit support.shopsphere.com or email help@shopsphere.com.</p>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4" /> Verified Authenticity
          </div>
        </div>
      </div>
    </div>
  );
};
