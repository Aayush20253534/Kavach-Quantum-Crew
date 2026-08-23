import React, { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  Loader2,
  Server,
  ServerCrash,
  Terminal,
} from 'lucide-react';

import { adminService } from '../api/adminService';

export function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      adminService.getAuditLogs({ limit: 100 }),
      adminService.getAuditSummary(),
      adminService.getDiagnostics(),
    ])
      .then(([audit, auditSummary, health]) => {
        setLogs(audit?.items || []);
        setSummary(auditSummary);
        setDiagnostics(health);
      })
      .catch((requestError) => {
        setError(
          requestError?.response?.data?.error?.message ||
            requestError?.message ||
            'Unable to read administrative diagnostics.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto pb-10 space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
          System Admin
        </p>
        <h1 className="mt-1 text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6" /> Audit & Diagnostics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Live audit records and backend diagnostics. No decorative uptime numbers involved.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 flex gap-3">
          <ServerCrash className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <Metric
          icon={Database}
          label="Database"
          value={(diagnostics?.database?.status || 'unknown').toUpperCase()}
        />
        <Metric
          icon={Server}
          label="Backend"
          value={(diagnostics?.status || 'unknown').toUpperCase()}
        />
        <Metric
          icon={Terminal}
          label="Audit events"
          value={summary?.total ?? 0}
        />
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden min-h-[520px]">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-300">
            System Audit Trail
          </h2>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="p-4 overflow-x-auto font-mono text-[11px] space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="min-w-[760px] grid grid-cols-[160px_180px_120px_1fr] gap-3">
                <span className="text-slate-500">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
                <span className="text-emerald-400 truncate">
                  {log.action}
                </span>
                <span className="text-blue-400 truncate">
                  {log.actorRole || 'SYSTEM'}
                </span>
                <span className="text-slate-300 break-all">
                  {log.entityType || '—'} {log.entityId || ''}{' '}
                  {log.metadata ? JSON.stringify(log.metadata) : ''}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-slate-500 py-10 text-center">
                No audit events recorded.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <Icon className="w-5 h-5 text-indigo-600" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3">
        {label}
      </p>
      <p className="text-xl font-black mt-1">{value}</p>
    </div>
  );
}
