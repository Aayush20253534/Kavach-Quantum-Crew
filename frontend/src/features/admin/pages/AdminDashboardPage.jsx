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

const cards = [
  ['Tourists', 'tourists', Users],
  ['Disaster Managers', 'disasterManagers', ShieldAlert],
  ['Active Trips', 'activeTrips', Route],
  ['Open Incidents', 'openIncidents', AlertTriangle],
  ['Critical Incidents', 'criticalIncidents', ShieldAlert],
  ['Pending Hazards', 'pendingHazards', AlertTriangle],
  ['Emergency Units', 'availableEmergencyUnits', Activity],
  ['Destinations', 'activeDestinations', MapPinned],
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
            'Unable to load system administration dashboard.',
        );
      });
  }, []);

  if (!summary && !error) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-10 space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
          System Admin
        </p>
        <h1 className="mt-1 text-2xl font-black uppercase tracking-tight">
          Platform Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Live platform totals, operational health and tourist destination management.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(([label, key, Icon]) => (
            <div key={key} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {label}
                </p>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">
                {summary[key] ?? 0}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-black text-sm uppercase tracking-wide">
            Administrative shortcuts
          </h2>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <Shortcut
              to="/admin/locations"
              icon={MapPinned}
              title="Destinations"
              text="Add locations and dashboard images."
            />
            <Shortcut
              to="/admin/accounts"
              icon={Users}
              title="Accounts"
              text="Manage tourist and staff access."
            />
            <Shortcut
              to="/admin/audit"
              icon={Database}
              title="Audit"
              text="Inspect system activity and diagnostics."
            />
          </div>
        </div>

        <div className="bg-slate-950 text-white rounded-xl p-6 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
            Backend health
          </p>
          <p
            className={`mt-3 text-xl font-black ${
              diagnostics?.status === 'healthy'
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {(diagnostics?.status || 'unknown').toUpperCase()}
          </p>
          <div className="mt-5 space-y-2 text-xs">
            <p className="flex justify-between gap-3">
              <span className="text-slate-400">Database</span>
              <span>{diagnostics?.database?.status || 'unknown'}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-slate-400">Uptime</span>
              <span>{Math.floor((diagnostics?.uptimeSeconds || 0) / 60)} min</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-slate-400">Heap used</span>
              <span>
                {diagnostics?.memory?.heapUsedBytes
                  ? `${Math.round(
                      diagnostics.memory.heapUsedBytes / 1024 / 1024,
                    )} MB`
                  : '—'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Shortcut({ to, icon: Icon, title, text }) {
  return (
    <Link
      to={to}
      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition"
    >
      <Icon className="w-5 h-5 text-indigo-600" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{text}</p>
    </Link>
  );
}
