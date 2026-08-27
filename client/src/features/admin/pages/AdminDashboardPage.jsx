import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Database,
  Loader2,
  MapPinned,
  Route,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { adminService } from '../api/adminService';

const metrics = [
  ['Registered Tourists', 'tourists', Users, 'Identity'],
  ['Disaster Management Accounts', 'disasterManagers', ShieldAlert, 'Access'],
  ['Active Trips', 'activeTrips', Route, 'Operations'],
  ['Active Incidents', 'openIncidents', AlertTriangle, 'Operations'],
  ['Critical Incidents', 'criticalIncidents', ShieldAlert, 'Operations'],
  ['Open Safety Reports', 'pendingHazards', AlertTriangle, 'Safety'],
  ['Available Fleet Units', 'availableEmergencyUnits', Activity, 'Response'],
  ['Managed Destinations', 'activeDestinations', MapPinned, 'Content'],
];

export function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      adminService.getDashboardSummary(),
      adminService.getDiagnostics(),
    ])
      .then(([dashboard, health]) => {
        setSummary(dashboard);
        setDiagnostics(health);
      })
      .catch((requestError) => {
        setError(
          requestError?.response?.data?.error?.message ||
            requestError?.message ||
            'Unable to load the administration overview.',
        );
      });
  }, []);

  if (!summary && !error) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  const health = diagnostics?.status || 'unknown';
  const healthLabel =
    health === 'healthy' ? 'Operational' : health === 'unknown' ? 'Unavailable' : 'Degraded';

  return (
    <div className="mx-auto max-w-[1360px] space-y-8 pb-12">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Administration
        </p>
        <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Platform Overview
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Platform access, live operations, emergency response capacity and managed tourist content.
            </p>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Live administrative data
          </p>
        </div>
      </header>

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {summary && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">
              Operational Summary
            </h2>
            <span className="text-[10px] font-semibold text-slate-400">Current totals</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(([label, key, Icon, group]) => (
              <div
                key={key}
                className="min-h-[108px] rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      {group}
                    </p>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-slate-700">
                      {label}
                    </p>
                  </div>
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
                <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  {summary[key] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-800">
              Administration Workspace
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Frequently used platform controls.
            </p>
          </div>
          <div className="grid sm:grid-cols-3">
            <Shortcut
              to="/admin/locations"
              icon={MapPinned}
              title="Destination Registry"
              text="Manage tourist-facing locations, coordinates and imagery."
            />
            <Shortcut
              to="/admin/accounts"
              icon={Users}
              title="Identity & Access"
              text="Review tourist, authority, fleet and administrative accounts."
            />
            <Shortcut
              to="/admin/audit"
              icon={Database}
              title="Audit & Diagnostics"
              text="Review administrative actions and backend health information."
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Platform Diagnostics
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Service state
                </p>
                <p className="mt-1 text-lg font-black text-slate-950">{healthLabel}</p>
              </div>
              <span
                className={`h-2.5 w-2.5 ${
                  health === 'healthy' ? 'bg-emerald-500' : health === 'unknown' ? 'bg-slate-400' : 'bg-amber-500'
                }`}
                aria-hidden="true"
              />
            </div>

            <dl className="divide-y divide-slate-100 text-[11px]">
              <DiagnosticRow label="Database" value={diagnostics?.database?.status || 'unknown'} />
              <DiagnosticRow
                label="Backend uptime"
                value={`${Math.floor((diagnostics?.uptimeSeconds || 0) / 60)} min`}
              />
              <DiagnosticRow
                label="Heap memory used"
                value={
                  diagnostics?.memory?.heapUsedBytes
                    ? `${Math.round(diagnostics.memory.heapUsedBytes / 1024 / 1024)} MB`
                    : 'Not available'
                }
              />
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}

function Shortcut({ to, icon: Icon, title, text }) {
  return (
    <Link
      to={to}
      className="group min-h-[148px] border-b border-slate-200 p-4 transition-colors hover:bg-slate-50 sm:border-b-0 sm:border-r last:border-r-0"
    >
      <Icon className="h-5 w-5 text-slate-700 transition-colors group-hover:text-slate-950" />
      <p className="mt-5 text-sm font-black text-slate-950">{title}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{text}</p>
    </Link>
  );
}

function DiagnosticRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="font-bold capitalize text-slate-800">{value}</dd>
    </div>
  );
}
