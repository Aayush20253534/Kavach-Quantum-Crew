import React, { useEffect, useState } from 'react';
import {
  Database,
  KeyRound,
  Loader2,
  Server,
  Settings,
  ShieldCheck,
} from 'lucide-react';

import { adminService } from '../api/adminService';

export function AdminSettingsPage() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      adminService.getDiagnostics(),
      adminService.getIntegrations(),
    ])
      .then(([health, integrations]) => {
        setDiagnostics(health);
        setCapabilities(integrations);
      })
      .catch((requestError) =>
        setError(
          requestError?.response?.data?.error?.message ||
            'Unable to load platform configuration.',
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
          <Settings className="w-6 h-6" /> Platform Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Runtime configuration exposed by the backend. Secrets and deployment environment values remain managed on Render/Vercel rather than pretending a browser toggle rewrites a server.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {!diagnostics && !error ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : diagnostics ? (
        <div className="grid md:grid-cols-2 gap-5">
          <ConfigCard
            icon={Server}
            title="Application Runtime"
            rows={[
              ['Backend status', diagnostics.status],
              ['Uptime', `${Math.floor((diagnostics.uptimeSeconds || 0) / 60)} minutes`],
              ['Checked at', diagnostics.checkedAt],
            ]}
          />
          <ConfigCard
            icon={Database}
            title="Database"
            rows={[
              ['Status', diagnostics.database?.status || 'unknown'],
              [
                'Latency',
                diagnostics.database?.latencyMs != null
                  ? `${diagnostics.database.latencyMs} ms`
                  : 'reported by health adapter',
              ],
            ]}
          />
          <ConfigCard
            icon={ShieldCheck}
            title="AI / Blockchain"
            rows={[
              [
                'AI provider',
                capabilities?.ai?.providerConfigured
                  ? 'configured'
                  : 'mock adapter',
              ],
              [
                'Blockchain provider',
                capabilities?.blockchain?.providerConfigured
                  ? 'configured'
                  : 'mock adapter',
              ],
            ]}
          />
          <ConfigCard
            icon={KeyRound}
            title="Secrets & Security"
            rows={[
              ['API secrets', 'Environment managed'],
              ['JWT secrets', 'Environment managed'],
              ['Cloudinary keys', 'Environment managed'],
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

function ConfigCard({ icon: Icon, title, rows }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <Icon className="w-5 h-5 text-indigo-600" />
      <h2 className="font-black mt-3">{title}</h2>
      <div className="mt-5 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="py-3 flex justify-between gap-5 text-xs">
            <span className="text-slate-500">{label}</span>
            <span className="font-bold text-right break-all">{value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
