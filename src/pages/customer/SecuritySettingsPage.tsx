import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Switch } from '../../components/common/Switch';
import { KeyRound, Smartphone, Laptop, CheckCircle2 } from 'lucide-react';

export const SecuritySettingsPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeSessions = [
    {
      id: 'sess_1',
      device: 'MacBook Pro 16" - Chrome 129',
      location: 'San Francisco, CA, USA',
      ip: '192.0.2.1',
      current: true,
      lastActive: 'Active now',
    },
    {
      id: 'sess_2',
      device: 'iPhone 15 Pro - Mobile App',
      location: 'San Jose, CA, USA',
      ip: '198.51.100.42',
      current: false,
      lastActive: '2 hours ago',
    },
  ];

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) return;
    setIsSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Password Management */}
      <Card className="p-6 sm:p-8">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" /> Change Account Password
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ensure your password is at least 8 characters with numbers and special symbols.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          />

          {isSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Password successfully changed!</span>
            </div>
          )}

          <Button type="submit" disabled={!newPassword || newPassword !== confirmPassword}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* Two Factor Authentication */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-600" /> Two-Factor Authentication (2FA)
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Add an additional layer of defense by requiring an authentication code on login.
            </p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onChange={setTwoFactorEnabled}
          />
        </div>
      </Card>

      {/* Active Sessions */}
      <Card className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Laptop className="w-5 h-5 text-indigo-600" /> Active Login Sessions
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activeSessions.map((sess) => (
            <div key={sess.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {sess.device}
                  </span>
                  {sess.current && (
                    <Badge variant="success" size="sm">
                      Current Session
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {sess.location} • {sess.ip} • {sess.lastActive}
                </p>
              </div>

              {!sess.current && (
                <Button variant="outline" size="sm" className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
