import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { User } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Eye,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, fetchUsers, updateUserStatus } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUserForBan, setSelectedUserForBan] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const userName = u.name || u.fullName || '';
    const matchesSearch =
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleBan = (u: User) => {
    const newStatus = u.status === 'banned' ? 'active' : 'banned';
    updateUserStatus(u.id, newStatus, 'Status modified by administrator');
    setSelectedUserForBan(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            User Accounts & Permissions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Oversee registered customer accounts, vendor access levels, and moderation bans.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-900 text-slate-200"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6 font-semibold">User</th>
                <th className="py-3.5 px-6 font-semibold">Email</th>
                <th className="py-3.5 px-6 font-semibold">Role</th>
                <th className="py-3.5 px-6 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold">Registered</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={u.name}
                        size="sm"
                      />
                      <span className="font-bold text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-slate-400 font-mono">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge
                      variant={
                        u.role === 'admin'
                          ? 'danger'
                          : u.role === 'seller'
                          ? 'primary'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge
                      variant={
                        u.status === 'banned'
                          ? 'danger'
                          : u.status === 'suspended' || u.status === 'pending_verification'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {u.status || 'ACTIVE'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-6 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="text-xs h-7 gap-1 text-indigo-400 hover:text-indigo-300"
                      >
                        <Eye className="w-3.5 h-3.5" /> Dossier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUserForBan(u)}
                        className={cn(
                          'text-xs h-7 gap-1',
                          u.status === 'banned'
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-rose-400 hover:text-rose-300'
                        )}
                      >
                        {u.status === 'banned' ? 'Unban' : 'Ban'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban / Moderation Modal */}
      <Modal
        isOpen={!!selectedUserForBan}
        onClose={() => setSelectedUserForBan(null)}
        title={selectedUserForBan?.status === 'banned' ? 'Re-activate Account' : 'Restrict & Ban Account'}
      >
        {selectedUserForBan && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-300">
              Are you sure you want to {selectedUserForBan.status === 'banned' ? 're-activate' : 'ban'}{' '}
              <b>{selectedUserForBan.name}</b> ({selectedUserForBan.email})?
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setSelectedUserForBan(null)}>
                Cancel
              </Button>
              <Button
                variant={selectedUserForBan.status === 'banned' ? 'primary' : 'danger'}
                onClick={() => handleToggleBan(selectedUserForBan)}
              >
                Confirm {selectedUserForBan.status === 'banned' ? 'Re-activation' : 'Ban'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
