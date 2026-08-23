import React, { useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Link as LinkIcon,
  Loader2,
  Puzzle,
  XCircle,
} from 'lucide-react';

import { adminService } from '../api/adminService';

export function AdminIntegrationsPage() {
  const [capabilities, setCapabilities] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService
      .getIntegrations()
      .then(setCapabilities)
      .catch((requestError) =>
        setError(
          requestError?.response?.data?.error?.message ||
            'Unable to load integration capabilities.',
        ),
      );
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto pb-10 space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
          System Admin
        </p>
        <h1 className="mt-1 text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          <Puzzle className="w-6 h-6" /> Integrations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Backend-reported AI and blockchain capabilities. Provider configuration remains environment-managed.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!capabilities && !error ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
      ) : capabilities ? (
        <div className="grid md:grid-cols-2 gap-5">
          <CapabilityCard
            icon={Bot}
            title="AI Provider"
            configured={capabilities.ai?.providerConfigured}
            capabilities={[
              ['Risk assessment', capabilities.ai?.riskAssessment],
              ['Hazard analysis', capabilities.ai?.hazardAnalysis],
            ]}
          />
          <CapabilityCard
            icon={LinkIcon}
            title="Blockchain Provider"
            configured={capabilities.blockchain?.providerConfigured}
            capabilities={[
              ['Safety ID proof', capabilities.blockchain?.safetyIdProof],
              ['Incident proof', capabilities.blockchain?.incidentProof],
              ['Evidence proof', capabilities.blockchain?.evidenceProof],
              ['Verification', capabilities.blockchain?.verification],
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

function CapabilityCard({ icon: Icon, title, configured, capabilities }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between gap-4">
        <div>
          <Icon className="w-6 h-6 text-indigo-600" />
          <h2 className="font-black mt-3">{title}</h2>
        </div>
        <span
          className={`h-fit px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
            configured
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {configured ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          {configured ? 'Configured' : 'Mock adapter'}
        </span>
      </div>

      <div className="mt-6 space-y-2">
        {capabilities.map(([label, enabled]) => (
          <div
            key={label}
            className="flex justify-between gap-3 p-3 bg-slate-50 rounded-lg text-xs"
          >
            <span>{label}</span>
            <span className={enabled ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
              {enabled ? 'Available' : 'Unavailable'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
