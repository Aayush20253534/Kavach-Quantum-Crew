import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Search,
  XCircle,
} from 'lucide-react';

import { emergencyServicesApi } from '../api/emergencyServicesApi';
import { Loader } from '../../../components/ui/Loader';

export function DispatchHistoryPage() {
  const { theme } = useOutletContext();
  const [dispatches, setDispatches] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDispatches = async () => {
      try {
        const response = await emergencyServicesApi.getDispatches();
        const allDispatches = response?.data?.data || [];
        setDispatches(
          allDispatches.filter((dispatch) =>
            ['COMPLETED', 'CANCELLED'].includes(dispatch.status),
          ),
        );
      } catch (err) {
        console.error('Failed to fetch dispatches:', err);
        setDispatches([]);
        setError(err?.response?.data?.error?.message || 'Unable to load dispatch history.');
      } finally {
        setLoading(false);
      }
    };

    fetchDispatches();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return dispatches.filter((dispatch) => {
      const matchesStatus =
        statusFilter === 'ALL' || dispatch.status === statusFilter;

      const haystack = [
        dispatch.id,
        dispatch.incident?.title,
        dispatch.incident?.description,
        dispatch.incident?.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [dispatches, query, statusFilter]);

  const completedCount = dispatches.filter((dispatch) => dispatch.status === 'COMPLETED').length;
  const cancelledCount = dispatches.filter((dispatch) => dispatch.status === 'CANCELLED').length;

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center">
        <Loader size="lg" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          Loading response history
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 pb-8">
      <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className={`h-1.5 w-full ${theme.bgClass}`} />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Response Records
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight text-slate-950">
              <History className={`h-5 w-5 ${theme.textClass}`} />
              Dispatch History
            </h1>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Completed and cancelled emergency-response assignments for this fleet account.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <HistoryMetric label="Total" value={dispatches.length} />
            <HistoryMetric label="Completed" value={completedCount} accentClass="text-emerald-700" />
            <HistoryMetric label="Cancelled" value={cancelledCount} accentClass="text-slate-600" />
          </div>
        </div>
      </section>

      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="rounded-lg border border-slate-300 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search incident or dispatch ID"
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="ALL">All outcomes</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50">
              <Search className="h-6 w-6 text-slate-300" />
            </div>
            <h2 className="mt-4 text-sm font-black text-slate-950">No Matching Dispatch Records</h2>
            <p className="mt-1 text-xs text-slate-500">
              No completed or cancelled dispatch matches the current filters.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    {['Dispatch', 'Incident', 'Assigned', 'Outcome', 'Reference'].map((heading) => (
                      <th
                        key={heading}
                        className="border-r border-slate-200 px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500 last:border-r-0"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((dispatch) => (
                    <tr key={dispatch.id} className="align-top hover:bg-slate-50">
                      <td className="border-r border-slate-200 px-4 py-3">
                        <p className="font-mono text-[10px] font-bold text-slate-600">
                          {dispatch.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="border-r border-slate-200 px-4 py-3">
                        <p className="text-xs font-black text-slate-900">
                          {dispatch.incident?.title || 'Emergency Incident'}
                        </p>
                        {dispatch.incident?.type && (
                          <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                            {String(dispatch.incident.type).replaceAll('_', ' ')}
                          </p>
                        )}
                      </td>
                      <td className="border-r border-slate-200 px-4 py-3">
                        <p className="text-[10px] font-bold text-slate-700">
                          {new Date(dispatch.createdAt).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-[9px] text-slate-400">
                          {new Date(dispatch.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="border-r border-slate-200 px-4 py-3">
                        <OutcomeBadge status={dispatch.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-semibold text-slate-400">
                          {dispatch.incident?.id?.slice?.(0, 8) || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {filtered.map((dispatch) => (
                <article key={dispatch.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {dispatch.incident?.title || 'Emergency Incident'}
                      </p>
                      <p className="mt-1 font-mono text-[9px] text-slate-400">
                        {dispatch.id.slice(0, 8)}
                      </p>
                    </div>
                    <OutcomeBadge status={dispatch.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-slate-50 p-2.5">
                      <p className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-400">
                        <CalendarDays className="h-3 w-3" /> Date
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-slate-700">
                        {new Date(dispatch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-2.5">
                      <p className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-400">
                        <Clock3 className="h-3 w-3" /> Time
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-slate-700">
                        {new Date(dispatch.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function HistoryMetric({ label, value, accentClass = 'text-slate-950' }) {
  return (
    <div className="min-w-[88px] rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className={`mt-1 text-base font-black ${accentClass}`}>{value}</p>
    </div>
  );
}

function OutcomeBadge({ status }) {
  const completed = status === 'COMPLETED';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${
        completed
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      {completed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {status}
    </span>
  );
}
