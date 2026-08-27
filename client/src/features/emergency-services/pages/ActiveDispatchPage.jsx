import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crosshair,
  MapPin,
  Navigation,
  Radio,
  Route,
  ShieldCheck,
} from 'lucide-react';

import { emergencyServicesApi } from '../api/emergencyServicesApi';
import { Loader } from '../../../components/ui/Loader';

const FLOW = ['ASSIGNED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED'];

const humanizeStatus = (value) => String(value || '').replaceAll('_', ' ');

export function ActiveDispatchPage() {
  const { theme, responderProfile } = useOutletContext();
  const [searchParams] = useSearchParams();
  const requestedDispatchId = searchParams.get('dispatch') || '';
  const ThemeIcon = theme.icon;

  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchDispatches = async () => {
    try {
      const response = await emergencyServicesApi.getDispatches();
      const rows = response?.data?.data || [];
      setDispatches(rows.filter((dispatch) => !['COMPLETED', 'CANCELLED'].includes(dispatch.status)));
      setError('');
    } catch (err) {
      console.error('Failed to fetch dispatches:', err);
      setDispatches([]);
      setError(err?.response?.data?.error?.message || 'Unable to load active dispatches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
    const interval = window.setInterval(fetchDispatches, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation || dispatches.length === 0) return undefined;

    const tracked =
      dispatches.find((dispatch) => dispatch.id === requestedDispatchId) ||
      dispatches[0];

    if (!tracked) return undefined;

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        emergencyServicesApi
          .updateDispatchLocation(tracked.id, {
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
          .catch((err) => {
            setError(
              err?.response?.data?.error?.message ||
                'Unable to transmit live dispatch location.',
            );
          });
      },
      () => setError('Location permission is required for live dispatch tracking.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [dispatches, requestedDispatchId]);

  const orderedDispatches = useMemo(() => {
    if (!requestedDispatchId) return dispatches;
    return [...dispatches].sort((left, right) =>
      left.id === requestedDispatchId ? -1 : right.id === requestedDispatchId ? 1 : 0,
    );
  }, [dispatches, requestedDispatchId]);

  const handleUpdateStatus = async (dispatchId, newStatus) => {
    setUpdating(dispatchId);
    setError('');
    try {
      await emergencyServicesApi.updateDispatchStatus(dispatchId, { status: newStatus });
      await fetchDispatches();
    } catch (err) {
      console.error('Failed to update status', err);
      setError(err?.response?.data?.error?.message || 'Unable to update dispatch status.');
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const index = FLOW.indexOf(currentStatus);
    return index >= 0 && index < FLOW.length - 1 ? FLOW[index + 1] : null;
  };

  const nextActionLabel = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return 'Acknowledge & Dispatch';
      case 'DISPATCHED':
        return 'Begin Response';
      case 'EN_ROUTE':
        return 'Mark On Scene';
      case 'ON_SCENE':
        return 'Complete Response';
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center">
        <Loader size="lg" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          Synchronizing dispatch operations
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 pb-8">
      <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className={`h-1.5 w-full ${theme.bgClass}`} />
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${theme.lightBgClass} ${theme.textClass}`}>
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Response Operations
                </p>
                <h1 className="text-xl font-black tracking-tight text-slate-950">
                  Active Dispatch
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-500">
              Review active assignments, transmit responder GPS and advance only through the valid operational response sequence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryMetric
              label="Active"
              value={dispatches.length}
              icon={Radio}
              accentClass={theme.textClass}
            />
            <SummaryMetric
              label={theme.readinessLabel}
              value={dispatches.length ? 'ENGAGED' : 'READY'}
              icon={ShieldCheck}
              accentClass={dispatches.length ? 'text-amber-600' : 'text-emerald-600'}
            />
            <SummaryMetric
              label="Base"
              value={responderProfile?.organization || responderProfile?.name || theme.unitLabel}
              icon={MapPin}
              accentClass="text-slate-600"
              wide
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {orderedDispatches.length === 0 ? (
        <section className="rounded-lg border border-slate-300 bg-white p-10 text-center">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${theme.lightBgClass}`}>
            <CheckCircle2 className={`h-6 w-6 ${theme.textClass}`} />
          </div>
          <h2 className="mt-4 text-base font-black text-slate-950">Unit Ready for Assignment</h2>
          <p className="mt-1 text-xs text-slate-500">
            No active emergency dispatches are assigned to this account.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {orderedDispatches.map((dispatch) => {
            const nextStatus = getNextStatus(dispatch.status);
            const currentIndex = Math.max(0, FLOW.indexOf(dispatch.status));
            const incident = dispatch.incident || {};

            return (
              <article
                key={dispatch.id}
                className="overflow-hidden rounded-lg border border-slate-300 bg-white"
              >
                <div className="grid gap-0 lg:grid-cols-[1fr_290px]">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${theme.lightBgClass} ${theme.textClass} ${theme.borderClass}`}
                      >
                        {humanizeStatus(dispatch.status)}
                      </span>
                      <span className="font-mono text-[9px] font-bold uppercase text-slate-400">
                        Dispatch {dispatch.id.slice(0, 8)}
                      </span>
                    </div>

                    <h2 className="mt-4 text-lg font-black tracking-tight text-slate-950">
                      {incident.title || 'Emergency Incident'}
                    </h2>

                    {incident.description && (
                      <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                        {incident.description}
                      </p>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <InfoTile
                        icon={MapPin}
                        label="Incident location"
                        value={
                          Number.isFinite(Number(incident.latitude)) &&
                          Number.isFinite(Number(incident.longitude))
                            ? `${Number(incident.latitude).toFixed(5)}, ${Number(incident.longitude).toFixed(5)}`
                            : 'Location pending'
                        }
                      />
                      <InfoTile
                        icon={Clock3}
                        label="Assigned"
                        value={new Date(dispatch.createdAt).toLocaleString()}
                      />
                      <InfoTile
                        icon={Crosshair}
                        label="Current state"
                        value={humanizeStatus(dispatch.status)}
                      />
                    </div>

                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute left-0 right-0 top-[9px] h-px bg-slate-200" />
                        <div className="relative grid grid-cols-5 gap-2">
                          {FLOW.map((step, index) => {
                            const past = index <= currentIndex;
                            const current = index === currentIndex;
                            return (
                              <div key={step} className="min-w-0">
                                <div
                                  className={`mx-auto h-[18px] w-[18px] rounded-full border-2 ${
                                    current
                                      ? `${theme.bgClass} border-white ring-4 ${theme.ringClass}`
                                      : past
                                        ? `${theme.bgClass} border-white`
                                        : 'border-white bg-slate-200'
                                  }`}
                                />
                                <p
                                  className={`mt-2 truncate text-center text-[8px] font-black uppercase tracking-wide ${
                                    current ? theme.textClass : 'text-slate-400'
                                  }`}
                                >
                                  {humanizeStatus(step)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Dispatch Control
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-950">
                      {nextActionLabel(dispatch.status) || 'Response complete'}
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      Only the next valid lifecycle action is available.
                    </p>

                    {nextStatus && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(dispatch.id, nextStatus)}
                        disabled={updating === dispatch.id}
                        className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors disabled:opacity-50 ${theme.bgClass} ${theme.hoverBgClass}`}
                      >
                        {updating === dispatch.id ? (
                          <Loader size="sm" className="text-white" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                        {nextActionLabel(dispatch.status)}
                      </button>
                    )}

                    <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-4 text-[10px] font-semibold text-slate-500">
                      <Route className="h-4 w-4" />
                      GPS tracking is active while this dispatch remains open.
                    </div>
                  </aside>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryMetric({ label, value, icon: Icon, accentClass, wide = false }) {
  return (
    <div className={`${wide ? 'col-span-2 sm:col-span-1' : ''} min-w-[128px] rounded-lg border border-slate-200 bg-slate-50 p-3`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <Icon className={`h-3.5 w-3.5 ${accentClass}`} />
      </div>
      <p className="mt-2 truncate text-xs font-black text-slate-900">{value}</p>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-2 break-words text-[10px] font-bold leading-4 text-slate-700">{value}</p>
    </div>
  );
}
