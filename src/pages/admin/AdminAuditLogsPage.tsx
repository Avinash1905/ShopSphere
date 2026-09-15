import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  ShieldAlert,
  Info,
  AlertTriangle,
  Code,
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: 'log_1',
      userId: 'usr_admin_1',
      userName: 'Root Administrator',
      action: 'APPROVE_SELLER_KYC',
      entityType: 'seller',
      entityId: 'sel_1',
      details: { storeName: 'Aura Sound Technologies Ltd.', verifiedBy: 'SuperAdmin' },
      ipAddress: '192.0.2.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: '2026-10-24T10:14:00.000Z',
    },
    {
      id: 'log_2',
      userId: 'usr_admin_1',
      userName: 'Root Administrator',
      action: 'UPDATE_COMMISSION_RATE',
      entityType: 'platform_settings',
      entityId: 'global_rate',
      details: { previousRate: 8, newRate: 10 },
      ipAddress: '192.0.2.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: '2026-10-23T16:30:00.000Z',
    },
    {
      id: 'log_3',
      userId: 'usr_system',
      userName: 'Automated Fraud Shield',
      action: 'FLAG_SPAM_REVIEW',
      entityType: 'review',
      entityId: 'rev_flag_1',
      details: { reason: 'Phishing hyperlink in body', confidence: 0.98 },
      ipAddress: '127.0.0.1',
      userAgent: 'ShopSphere-SecurityDaemon/1.0',
      createdAt: '2026-10-22T08:15:00.000Z',
    },
    {
      id: 'log_4',
      userId: 'usr_admin_1',
      userName: 'Root Administrator',
      action: 'BAN_USER_ACCOUNT',
      entityType: 'user',
      entityId: 'usr_bad_99',
      details: { reason: 'Multiple chargeback fraud attempts' },
      ipAddress: '192.0.2.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: '2026-10-21T11:45:00.000Z',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.ipAddress.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Security & Compliance Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable platform audit trail tracking administrative actions, KYC decisions, and fraud mitigation.
          </p>
        </div>
        <Button variant="outline" className="gap-1.5 shrink-0 text-slate-300 border-slate-700">
          <Download className="w-4 h-4" /> Export CSV Ledger
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search action, actor, or IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6 font-semibold">Timestamp</th>
                <th className="py-3.5 px-6 font-semibold">Event Action</th>
                <th className="py-3.5 px-6 font-semibold">Actor</th>
                <th className="py-3.5 px-6 font-semibold">Entity</th>
                <th className="py-3.5 px-6 font-semibold">IP Address</th>
                <th className="py-3.5 px-6 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-6 text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-indigo-400">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-6 text-white font-medium">
                    {log.userName}
                  </td>
                  <td className="py-3.5 px-6 text-slate-400">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-400">
                    {log.ipAddress}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="text-xs text-slate-300 hover:text-white"
                    >
                      <Code className="w-3.5 h-3.5 mr-1" /> Payload
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Event Payload"
      >
        {selectedLog && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1 text-slate-300 font-mono">
              <p><b>Event ID:</b> {selectedLog.id}</p>
              <p><b>Action:</b> {selectedLog.action}</p>
              <p><b>Actor:</b> {selectedLog.userName} ({selectedLog.userId})</p>
              <p><b>IP Address:</b> {selectedLog.ipAddress}</p>
              <p><b>User Agent:</b> {selectedLog.userAgent}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                JSON Event Payload:
              </span>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
