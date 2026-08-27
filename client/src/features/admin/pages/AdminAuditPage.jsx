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
            'Unable to load audit and diagnostics data.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-[1360px] space-y-7 pb-12">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Governance
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950">
          <Activity className="h-5 w-5" />
          Audit & Diagnostics
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Administrative activity, access changes and live platform health information.
        </p>
      </header>

      {error && (
        <div className="flex gap-3 border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          <ServerCrash className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="grid max-w-[1100px] gap-3 sm:grid-cols-3">
        <Metric
          icon={Database}
          label="Database State"
          value={(diagnostics?.database?.status || 'unknown').toUpperCase()}
        />
        <Metric
          icon={Server}
          label="Backend State"
          value={(diagnostics?.status || 'unknown').toUpperCase()}
        />
        <Metric
          icon={Terminal}
          label="Recorded Audit Events"
          value={summary?.total ?? 0}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-800">
              System Audit Trail
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Most recent administrative and operational events.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Latest 100 records</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Timestamp', 'Action', 'Actor', 'Entity', 'Details'].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-[10px] font-medium text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-black text-slate-900">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-semibold text-slate-600">
                      {log.actorRole || 'SYSTEM'}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-600">
                      <p className="font-semibold">{log.entityType || '—'}</p>
                      {log.entityId && (
                        <p className="mt-1 max-w-[210px] truncate font-mono text-[9px] text-slate-400">
                          {log.entityId}
                        </p>
                      )}
                    </td>
                    <td className="max-w-[420px] px-4 py-3 font-mono text-[9px] leading-5 text-slate-500">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center text-xs text-slate-500">
                      No audit events have been recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="min-h-[96px] rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-3 text-base font-black text-slate-950">{value}</p>
    </div>
  );
}
