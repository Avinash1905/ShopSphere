import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  MapPin,
  Phone,
  ArrowLeft,
  Navigation,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface TrackingEvent {
  title: string;
  location: string;
  timestamp: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentOrder, getOrderById } = useOrderStore();
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId);
    }
  }, [orderId, getOrderById]);

  const trackingNumber = 'FDX-9842-7719-US';
  const carrier = 'FedEx Express';
  const estimatedDelivery = 'Thursday, Oct 24, by 4:30 PM';

  const events: TrackingEvent[] = [
    {
      title: 'Order Confirmed & Payment Verified',
      location: 'ShopSphere Cloud Gateway',
      timestamp: 'Oct 21, 2026 - 10:14 AM',
      description: 'Order details verified, inventory allocated across seller hubs.',
      completed: true,
      current: false,
    },
    {
      title: 'Package Prepared & Packed',
      location: 'Fulfillment Center #04, Seattle WA',
      timestamp: 'Oct 21, 2026 - 02:45 PM',
      description: 'Items inspected for quality, packed in eco-friendly protective packaging.',
      completed: true,
      current: false,
    },
    {
      title: 'Shipped & Departed Sorting Facility',
      location: 'FedEx Regional Hub, Portland OR',
      timestamp: 'Oct 22, 2026 - 08:30 AM',
      description: 'In transit to local distribution center via priority air transport.',
      completed: true,
      current: true,
    },
    {
      title: 'Out for Final Delivery',
      location: 'Springfield Local Dispatch Center',
      timestamp: 'Expected Oct 24 - 09:00 AM',
      description: 'Package will be loaded onto delivery van for final mile drop-off.',
      completed: false,
      current: false,
    },
    {
      title: 'Delivered to Doorstep / Reception',
      location: 'Springfield, OR 97477',
      timestamp: 'Expected Oct 24 - by 4:30 PM',
      description: 'Package handed directly or placed safely at front porch.',
      completed: false,
      current: false,
    },
  ];

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(trackingNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Live Status:</span>
            <Badge variant="warning" size="sm" className="animate-pulse">
              In Transit
            </Badge>
          </div>
        </div>

        {/* Tracking Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Tracking Order #{orderId || 'ORD-98124'}
                </h1>
                <Badge variant="primary">{carrier}</Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Carrier Tracking #: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{trackingNumber}</span>
                <button
                  onClick={handleCopyTracking}
                  className="ml-2 text-xs text-indigo-600 hover:underline font-semibold"
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900 text-left md:text-right">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">
                {estimatedDelivery}
              </span>
            </div>
          </div>

          {/* Graphical Map / Simulated Transit Route */}
          <div className="mt-6 relative h-48 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500 text-indigo-400 flex items-center justify-center animate-bounce">
                <Navigation className="w-6 h-6 rotate-45" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Current Location: Portland Regional Hub, OR
              </span>
              <p className="text-xs text-slate-400">
                Driver en route to local distribution facility
              </p>
            </div>
          </div>
        </div>

        {/* Timeline & Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Milestone Timeline */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Milestone Timeline
            </h2>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {events.map((evt, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pl-1">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs ring-4 ring-white dark:ring-slate-900',
                      evt.completed
                        ? 'bg-emerald-600 text-white'
                        : evt.current
                        ? 'bg-indigo-600 text-white ring-indigo-100 dark:ring-indigo-900'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    )}
                  >
                    {evt.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3
                        className={cn(
                          'text-sm font-bold',
                          evt.completed || evt.current
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-400 dark:text-slate-500'
                        )}
                      >
                        {evt.title}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
                        {evt.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {evt.location}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {evt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courier & Delivery Instructions Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" /> Carrier Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Courier</span>
                  <span className="font-semibold text-slate-900 dark:text-white">FedEx Express Air</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Service Type</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Priority 2-Day</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Signature</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Not Required</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ExternalLink className="w-3.5 h-3.5" /> Track on FedEx.com
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Need Help?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                If your delivery has not arrived within the estimated window, contact customer support for instant resolution.
              </p>
              <div className="mt-4 space-y-2">
                <Button variant="secondary" size="sm" className="w-full">
                  Contact Support
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-slate-500">
                  Update Delivery Instructions
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
