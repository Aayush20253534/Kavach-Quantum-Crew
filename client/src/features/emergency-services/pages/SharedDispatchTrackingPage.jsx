import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Loader2, MapPin, Navigation } from 'lucide-react';
import { emergencyServicesApi } from '../api/emergencyServicesApi';
import { MapComponent } from '../../tracking/components/MapComponent';

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

  const unitLocation = useMemo(() => tracking?.unit?.location ? ({ lat: tracking.unit.location.latitude, lng: tracking.unit.location.longitude }) : null, [tracking]);

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
          <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            <MapComponent currentLocation={unitLocation} className="h-[500px] w-full rounded-2xl" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 flex items-center gap-2"><MapPin className="h-4 w-4" />Last unit update: {tracking.unit?.location?.updatedAt ? new Date(tracking.unit.location.updatedAt).toLocaleString() : 'Waiting for GPS'}</div>
        </>
      )}
    </div>
  );
}
