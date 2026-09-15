import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
} from 'lucide-react';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { users, fetchUsers, updateUserRole } = useAdminStore();
  const [selectedRole, setSelectedRole] = useState<'customer' | 'seller' | 'admin'>('customer');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const user = users.find((u) => u.id === id) || {
    id: id || 'usr_1',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    phone: '+1 (555) 234-5678',
    status: 'active',
    createdAt: '2024-09-15T00:00:00.000Z',
    addresses: [],
  };

  const handleRoleSave = () => {
    if (user.id) {
      updateUserRole(user.id, selectedRole);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to User Directory
      </Link>

      {/* Profile Dossier Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <Avatar
          src={user.avatar}
          alt={user.name}
          size="xl"
          className="w-24 h-24 ring-4 ring-indigo-500/20"
        />

        <div className="text-center sm:text-left flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h1 className="text-2xl font-black text-white">{user.name}</h1>
            <Badge variant="primary" size="sm">{user.role.toUpperCase()}</Badge>
            <Badge variant="success" size="sm">{user.status || 'ACTIVE'}</Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono">User ID: #{user.id}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-400" /> {user.email}</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {user.phone || 'No phone recorded'}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Role & Permissions Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" /> Role & Privilege Level
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
            className="w-full sm:w-64 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-900 text-white"
          >
            <option value="customer">Customer (Standard Buyer)</option>
            <option value="seller">Seller (Store Vendor)</option>
            <option value="admin">Administrator (Full Control)</option>
          </select>
          <Button onClick={handleRoleSave} size="sm" className="w-full sm:w-auto">
            Update Role Privileges
          </Button>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" /> Recent User Activity Logs
        </h3>

        <div className="divide-y divide-slate-800 text-xs text-slate-400">
          {[
            { action: 'Completed Checkout #ORD-98124 ($403.77)', time: '2 hours ago', ip: '192.0.2.1' },
            { action: 'Updated shipping address to Springfield, OR', time: '1 day ago', ip: '192.0.2.1' },
            { action: 'Added Aura Wireless Headphones to Cart', time: '1 day ago', ip: '192.0.2.1' },
            { action: 'Successful Account Login via 2FA', time: '3 days ago', ip: '198.51.100.42' },
          ].map((act, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center">
              <span>{act.action}</span>
              <span className="font-mono text-slate-500">{act.time} ({act.ip})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
