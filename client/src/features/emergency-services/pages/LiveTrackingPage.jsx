import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapPin, Navigation, Signal, Loader2, AlertTriangle, Crosshair } from 'lucide-react';
import { emergencyServicesApi } from '../api/emergencyServicesApi';
import { MapComponent } from '../../tracking/components/MapComponent';

export function LiveTrackingPage() {
  const { theme } = useOutletContext();
  const [dispatches, setDispatches] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await emergencyServicesApi.getDispatches();
        const rows = response?.data?.data || [];
        const active = rows.filter((d) => !['COMPLETED', 'CANCELLED'].includes(d.status));
        if (!cancelled) {
          setDispatches(active);
          setSelectedId((current) => current || active[0]?.id || '');
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error?.message || 'Unable to load active dispatches.');
      }
    };
    load();
    const timer = window.setInterval(load, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!selectedId) { setTracking(null); return undefined; }
    let cancelled = false;
    const load = async () => {
      try {
        const response = await emergencyServicesApi.getTracking(selectedId);
        if (!cancelled) setTracking(response?.data?.data || null);
      } catch {}
    };
    load();
    const timer = window.setInterval(load, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setLocation(next);
        setError('');
        setSending(true);
        try {
          await emergencyServicesApi.updateDispatchLocation(selectedId, next);
        } catch (e) {
          setError(e?.response?.data?.error?.message || 'Live location update failed.');
        } finally {
          setSending(false);
        }
      },
      () => setError('Location permission is required to transmit responder GPS.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [selectedId]);

  const mapLocation = useMemo(() => {
    const source = location || tracking?.unit?.location;
    return source ? { lat: source.latitude, lng: source.longitude } : null;
  }, [location, tracking]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`p-6 rounded-2xl ${theme.bgClass} text-white shadow-lg relative overflow-hidden`}>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2"><Navigation className="w-6 h-6" /> Live Tracking</h1>
            <p className="text-white/80 font-medium text-sm mt-1">GPS is sent to Disaster Management and exposed to the affected tourist/group for this dispatch.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border border-white/20">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Signal className="w-4 h-4" />}
            <span className="text-[10px] font-bold uppercase tracking-widest">{selectedId ? 'GPS Active' : 'Standby'}</span>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active dispatch</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-900">
          <option value="">No active dispatch selected</option>
          {dispatches.map((d) => <option key={d.id} value={d.id}>{d.incident?.title || 'Emergency'} · {d.status}</option>)}
        </select>
      </div>

      <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <MapComponent currentLocation={mapLocation} className="h-[480px] w-full rounded-2xl" />
      </div>

      {tracking && (
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] uppercase font-black text-slate-400">Status</p><p className="mt-1 font-black text-slate-900">{tracking.status}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] uppercase font-black text-slate-400">Distance remaining</p><p className="mt-1 font-black text-slate-900">{tracking.distanceRemainingM == null ? '—' : `${tracking.distanceRemainingM} m`}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] uppercase font-black text-slate-400">Coordinates</p><p className="mt-1 text-xs font-bold text-slate-900 flex items-center gap-1"><Crosshair className="w-3.5 h-3.5" />{mapLocation ? `${mapLocation.lat.toFixed(5)}, ${mapLocation.lng.toFixed(5)}` : 'Waiting for GPS'}</p></div>
        </div>
      )}
    </div>
  );
}
