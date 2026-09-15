import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Store, Camera, CheckCircle2, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export const StoreSettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('Aura Sound Technologies');
  const [tagline, setTagline] = useState('Audiophile-Grade Acoustic Engineering');
  const [email, setEmail] = useState('support@aurasound.com');
  const [phone, setPhone] = useState('+1 (555) 492-1084');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200');
  const [returnPolicy, setReturnPolicy] = useState('30-day no questions asked money-back guarantee. Item must be in original condition with box.');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Store Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your storefront branding, customer contact channels, and return guidelines.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Visual Branding Card */}
        <Card className="p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-600" /> Storefront Branding
          </h2>

          {/* Banner Preview */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Store Banner Image
            </label>
            <div className="h-40 rounded-2xl overflow-hidden relative group border border-slate-200 dark:border-slate-800">
              <img src={bannerUrl} alt="Store Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="outline" className="text-white border-white">
                  <Camera className="w-4 h-4 mr-1.5" /> Replace Banner
                </Button>
              </div>
            </div>
            <Input
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="Banner Image URL"
              className="mt-2 text-xs"
            />
          </div>

          {/* Logo & Basic Info */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative group shrink-0">
              <img
                src={logoUrl}
                alt="Store Logo"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-600/20 shadow-md"
              />
              <button
                type="button"
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center text-white"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <Input
                label="Store Public Name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
              <Input
                label="Store Slogan / Tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Contact & Legal Policies Card */}
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Contact & Policies
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Support Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />
            <Input
              label="Business Hotline"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Store Return & Warranty Policy
            </label>
            <textarea
              rows={3}
              value={returnPolicy}
              onChange={(e) => setReturnPolicy(e.target.value)}
              className="w-full p-3 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Card>

        {isSaved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Store profile and settings successfully updated!</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="min-w-[180px]">
            Save Store Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
