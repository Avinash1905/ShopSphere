import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

interface PendingKYC {
  id: string;
  storeName: string;
  applicantName: string;
  email: string;
  phone: string;
  businessType: string;
  taxId: string;
  documentUrl: string;
  appliedDate: string;
}

export const SellerApprovalPage: React.FC = () => {
  const [applications, setApplications] = useState<PendingKYC[]>([
    {
      id: 'app_1',
      storeName: 'Apex Audio Dynamics Ltd.',
      applicantName: 'James Wilson',
      email: 'james.wilson@apexaudio.com',
      phone: '+1 (555) 392-8812',
      businessType: 'Corporation (C-Corp)',
      taxId: 'XX-XXXX8912',
      documentUrl: 'https://example.com/docs/tax-certificate-apex.pdf',
      appliedDate: '2026-10-24',
    },
    {
      id: 'app_2',
      storeName: 'Nordic Craft Studio',
      applicantName: 'Freja Lindqvist',
      email: 'freja@nordiccraft.se',
      phone: '+46 8 123 4567',
      businessType: 'Sole Proprietorship',
      taxId: 'SE-98124012',
      documentUrl: 'https://example.com/docs/business-registry-nordic.pdf',
      appliedDate: '2026-10-23',
    },
    {
      id: 'app_3',
      storeName: 'Lumina Tech Solutions',
      applicantName: 'Chen Wei',
      email: 'chen.wei@luminatech.io',
      phone: '+1 (555) 771-9043',
      businessType: 'LLC',
      taxId: 'XX-XXXX5410',
      documentUrl: 'https://example.com/docs/ein-letter-lumina.pdf',
      appliedDate: '2026-10-22',
    },
  ]);

  const [selectedApp, setSelectedApp] = useState<PendingKYC | null>(null);

  const handleApprove = (id: string) => {
    setApplications(applications.filter((a) => a.id !== id));
    setSelectedApp(null);
  };

  const handleReject = (id: string) => {
    setApplications(applications.filter((a) => a.id !== id));
    setSelectedApp(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Seller KYC Onboarding Queue
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review legal incorporation credentials, verify tax certificates, and authorize vendor payouts.
        </p>
      </div>

      {/* List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">KYC Queue Cleared!</h3>
            <p className="text-xs text-slate-500 mt-1">There are no pending vendor applications awaiting review.</p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{app.storeName}</h3>
                  <Badge variant="warning" size="sm">KYC PENDING</Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="text-slate-300 font-medium">Applicant: {app.applicantName}</span>
                  <span>•</span>
                  <span>{app.businessType}</span>
                  <span>•</span>
                  <span className="font-mono">EIN / Tax: {app.taxId}</span>
                  <span>•</span>
                  <span>Applied: {app.appliedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApp(app)}
                  className="gap-1.5 text-xs text-slate-300 border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" /> Inspect Application
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(app.id)}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve KYC
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* KYC Inspector Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="KYC Verification Dossier"
      >
        {selectedApp && (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-slate-900 rounded-xl space-y-2 text-xs">
              <p><b>Legal Store Name:</b> {selectedApp.storeName}</p>
              <p><b>Registered Owner:</b> {selectedApp.applicantName}</p>
              <p><b>Contact Email:</b> {selectedApp.email}</p>
              <p><b>Contact Phone:</b> {selectedApp.phone}</p>
              <p><b>Entity Structure:</b> {selectedApp.businessType}</p>
              <p><b>Tax Identifier (EIN):</b> {selectedApp.taxId}</p>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-dashed border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Certificate of Incorporation & Tax Clearance.pdf</span>
              </div>
              <Button variant="ghost" size="sm" className="text-indigo-400 text-xs h-7">
                Preview PDF
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReject(selectedApp.id)}
              >
                Reject & Request Re-submission
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleApprove(selectedApp.id)}
              >
                Verify & Authorize Merchant
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
