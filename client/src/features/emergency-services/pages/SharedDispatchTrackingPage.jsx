import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Loader2, MapPin, Navigation } from 'lucide-react';
import { emergencyServicesApi } from '../api/emergencyServicesApi';
import { AuthorityOperationsMap } from '../../authority/components/AuthorityOperationsMap';

export function SharedDispatchTrackingPage() {
  const { dispatchId } = useParams();
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await emergencyServicesApi.getTracking(dispatchId);
        if (!cancelled) { setTracking(response?.data?.data || null); setError(''); }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error?.message || 'Unable to load emergency response tracking.');
      }
    };
    load();
    const timer = window.setInterval(load, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [dispatchId]);

  const unitLocation = useMemo(
    () => tracking?.unit?.location
      ? ({ lat: Number(tracking.unit.location.latitude), lng: Number(tracking.unit.location.longitude) })
      : null,
    [tracking],
  );

  const routeIncident = useMemo(() => {
    if (!tracking?.destination) return null;
    return {
      id: tracking.incidentId || 'incident',
      title: 'Tourist / incident location',
      status: tracking.status,
      severity: 'CRITICAL',
      latitude: Number(tracking.destination.latitude),
      longitude: Number(tracking.destination.longitude),
      description: 'Emergency destination for this dispatch.',
    };
  }, [tracking]);

  const routeUnit = useMemo(() => {
    if (!tracking?.unit || !unitLocation) return null;
    return {
      id: tracking.unit.id,
      name: tracking.unit.name,
      type: tracking.serviceType,
      status: tracking.status,
      organization: tracking.unit.organization,
      latitude: unitLocation.lat,
      longitude: unitLocation.lng,
    };
  }, [tracking, unitLocation]);

  if (!tracking && !error) return <div className="py-24 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">
      <div className="rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
        <h1 className="flex items-center gap-2 text-xl font-black"><Navigation className="h-5 w-5" /> Emergency response live tracking</h1>
        <p className="mt-1 text-xs text-slate-300">Live unit location is refreshed from the emergency-service backend.</p>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
      {tracking && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase text-slate-400">Service</p><p className="mt-1 font-black">{tracking.serviceType}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase text-slate-400">Status</p><p className="mt-1 font-black">{tracking.status}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase text-slate-400">Unit</p><p className="mt-1 font-black">{tracking.unit?.name || 'Awaiting assignment'}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase text-slate-400">Distance</p><p className="mt-1 font-black">{tracking.distanceRemainingM == null ? '—' : `${tracking.distanceRemainingM} m`}</p></div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Live response route</p>
                <p className="mt-1 text-[10px] font-semibold text-slate-500">Road route from the responding fleet to the tourist / incident location.</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Fleet</span>
                <span className="flex items-center gap-1.5 text-red-700"><span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Tourist</span>
              </div>
            </div>
            <div className="h-[500px] w-full">
              <AuthorityOperationsMap
                incidents={routeIncident ? [routeIncident] : []}
                units={routeUnit ? [routeUnit] : []}
                showRoutes
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 flex items-center gap-2"><MapPin className="h-4 w-4" />Last unit update: {tracking.unit?.location?.updatedAt ? new Date(tracking.unit.location.updatedAt).toLocaleString() : 'Waiting for GPS'}</div>
        </>
      )}
    </div>
  );
}
