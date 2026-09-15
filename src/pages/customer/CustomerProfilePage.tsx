import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { AddressBookPage } from './AddressBookPage';
import { SecuritySettingsPage } from './SecuritySettingsPage';
import { NotificationCenterPage } from './NotificationCenterPage';
import {
  User,
  MapPin,
  Shield,
  Bell,
  Camera,
  CheckCircle2,
  Calendar,
  Mail,
} from 'lucide-react';
import { cn } from '../../utils/cn';

type ProfileTab = 'profile' | 'addresses' | 'security' | 'notifications';

export const CustomerProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

  // Form state
  const [name, setName] = useState(user?.name || 'Alex Morgan');
  const [email, setEmail] = useState(user?.email || 'alex.morgan@example.com');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 234-5678');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, phone });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const navTabs = [
    { id: 'profile' as ProfileTab, label: 'Personal Information', icon: User },
    { id: 'addresses' as ProfileTab, label: 'Address Book', icon: MapPin },
    { id: 'security' as ProfileTab, label: 'Security & Password', icon: Shield },
    { id: 'notifications' as ProfileTab, label: 'Notification Center', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={user?.name || 'User Avatar'}
                size="xl"
                className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-indigo-50 dark:ring-indigo-950/40"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-transform transform group-hover:scale-110"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {user?.name || 'Alex Morgan'}
                </h1>
                <Badge variant="primary" size="sm" className="w-fit mx-auto sm:mx-0">
                  {user?.role?.toUpperCase() || 'CUSTOMER'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-4">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" /> {user?.email || 'alex.morgan@example.com'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Member since Sept 2024
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Tabs Sidebar */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="lg:col-span-9">
            {activeTab === 'profile' && (
              <Card className="p-6 sm:p-8">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Personal Information
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Update your account details and contact information.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <Input
                      label="Account Role"
                      value={user?.role || 'Customer'}
                      disabled
                    />
                  </div>

                  {isSaved && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Profile information updated successfully!</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" size="lg">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'addresses' && <AddressBookPage />}
            {activeTab === 'security' && <SecuritySettingsPage />}
            {activeTab === 'notifications' && <NotificationCenterPage />}
          </div>
        </div>
      </div>
    </div>
  );
};
