import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Bell,
  Package,
  Tag,
  ShieldAlert,
  CheckCircle,
  Trash2,
  Check,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface NotificationItem {
  id: string;
  type: 'order' | 'promo' | 'security' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export const NotificationCenterPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      type: 'order',
      title: 'Order Shipped: #ORD-98124',
      message: 'Your package containing Aura Wireless Headphones is en route via FedEx Priority.',
      timestamp: '2 hours ago',
      isRead: false,
    },
    {
      id: 'notif_2',
      type: 'promo',
      title: 'Flash Sale Alert! 25% Off Electronics',
      message: 'Use code FLASH25 at checkout before midnight tonight to save on all accessories.',
      timestamp: '1 day ago',
      isRead: false,
    },
    {
      id: 'notif_3',
      type: 'security',
      title: 'New Login Detected',
      message: 'A new login from MacBook Pro in San Francisco, CA was recorded for your account.',
      timestamp: '3 days ago',
      isRead: true,
    },
    {
      id: 'notif_4',
      type: 'order',
      title: 'Package Delivered',
      message: 'Order #ORD-97500 has been handed to recipient at front desk.',
      timestamp: '1 week ago',
      isRead: true,
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'order' | 'promo'>('all');

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'order') return n.type === 'order';
    if (activeFilter === 'promo') return n.type === 'promo';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-indigo-600" />;
      case 'promo':
        return <Tag className="w-5 h-5 text-emerald-600" />;
      case 'security':
        return <ShieldAlert className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" /> Notifications & Alerts
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time updates regarding orders, shipments, price drops, and account activity.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1.5">
          <Check className="w-4 h-4" /> Mark All as Read
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 pb-4">
        {(['all', 'unread', 'order', 'promo'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors',
              activeFilter === filter
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-slate-400">No notifications found.</p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                'py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4 transition-colors rounded-xl px-2',
                !item.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
              )}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={cn('text-sm font-bold', !item.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300')}>
                      {item.title}
                    </h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    {item.timestamp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!item.isRead && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="p-1.5 hover:text-indigo-600 text-slate-400"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 hover:text-rose-600 text-slate-400"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
