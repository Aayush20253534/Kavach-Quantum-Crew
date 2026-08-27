import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Clock3,
  Crosshair,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Signal,
} from 'lucide-react';

import { emergencyServicesApi } from '../api/emergencyServicesApi';
import { AuthorityOperationsMap } from '../../authority/components/AuthorityOperationsMap';

export function LiveTrackingPage() {
  const { theme, responderProfile } = useOutletContext();

  const [dispatches, setDispatches] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [routeSummary, setRouteSummary] = useState([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const gpsWatchRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    const stopLiveTracking = () => {
      mountedRef.current = false;
      if (gpsWatchRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
    };

    window.addEventListener('pagehide', stopLiveTracking);
    return () => {
      window.removeEventListener('pagehide', stopLiveTracking);
      stopLiveTracking();
    };
  }, []);

  const loadDispatches = useCallback(async () => {
    try {
      const response = await emergencyServicesApi.getDispatches();
      const rows = response?.data?.data || [];
      const active = rows.filter((dispatch) => !['COMPLETED', 'CANCELLED'].includes(dispatch.status));

      if (!mountedRef.current) return;

      setDispatches(active);
      setSelectedId((current) =>
        active.some((dispatch) => dispatch.id === current)
          ? current
          : active[0]?.id || '',
      );
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Unable to load active dispatches.');
    }
  }, []);

  useEffect(() => {
    loadDispatches();
    const timer = window.setInterval(loadDispatches, 15000);
    return () => window.clearInterval(timer);
  }, [loadDispatches]);

  const loadTracking = useCallback(async () => {
    if (!selectedId) {
      setTracking(null);
      return;
    }

    try {
      const response = await emergencyServicesApi.getTracking(selectedId);
      if (!mountedRef.current) return;
      setTracking(response?.data?.data || null);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Unable to load live response tracking.');
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setTracking(null);
      return undefined;
    }

    loadTracking();
    const timer = window.setInterval(loadTracking, 10000);
    return () => window.clearInterval(timer);
  }, [loadTracking, selectedId]);

  useEffect(() => {
    if (!selectedId || !navigator.geolocation) return undefined;

    let cancelled = false;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        if (cancelled || !mountedRef.current) return;

        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(next);
        setSending(true);

        try {
          await emergencyServicesApi.updateDispatchLocation(selectedId, next);
          if (!cancelled && mountedRef.current) setError('');
        } catch (err) {
          if (!cancelled && mountedRef.current) {
            setError(err?.response?.data?.error?.message || 'Live GPS transmission failed.');
          }
        } finally {
          if (!cancelled && mountedRef.current) setSending(false);
        }
      },
      () => {
        if (!cancelled && mountedRef.current) {
          setError('Location permission is required to transmit responder GPS.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );

    gpsWatchRef.current = watchId;

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
      if (gpsWatchRef.current === watchId) gpsWatchRef.current = null;
    };
  }, [selectedId]);

  const selectedDispatch = useMemo(
    () => dispatches.find((dispatch) => dispatch.id === selectedId) || null,
    [dispatches, selectedId],
  );

  const currentPoint = useMemo(() => {
    const source = location || tracking?.unit?.location;
    if (!source) return null;

    const latitude = Number(source.latitude);
    const longitude = Number(source.longitude);

    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { lat: latitude, lng: longitude }
      : null;
  }, [location, tracking]);

  const basePoint = useMemo(() => {
    const latitude = Number(responderProfile?.latitude);
    const longitude = Number(responderProfile?.longitude);

    return Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      !(latitude === 0 && longitude === 0)
      ? { lat: latitude, lng: longitude }
      : null;
  }, [responderProfile]);

  const incidentPoint = useMemo(() => {
    const source = tracking?.destination || selectedDispatch?.incident;
    if (!source) return null;

    const latitude = Number(source.latitude);
    const longitude = Number(source.longitude);

    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { lat: latitude, lng: longitude }
      : null;
  }, [selectedDispatch, tracking]);

  const routeIncident = useMemo(() => {
    if (!incidentPoint) return null;

    return {
      id: tracking?.incidentId || selectedDispatch?.incident?.id || selectedId || 'incident',
      title: selectedDispatch?.incident?.title || 'Tourist / incident location',
      status: tracking?.status || selectedDispatch?.status || 'ACTIVE',
      severity: selectedDispatch?.incident?.severity || 'CRITICAL',
      latitude: incidentPoint.lat,
      longitude: incidentPoint.lng,
      description:
        selectedDispatch?.incident?.description ||
        'Emergency destination for this active response.',
    };
  }, [incidentPoint, selectedDispatch, selectedId, tracking]);

  const routeUnit = useMemo(() => {
    if (!selectedId || !currentPoint) return null;

    return {
      id: tracking?.unit?.id || responderProfile?.id || 'current-unit',
      name:
        tracking?.unit?.name ||
        responderProfile?.organization ||
        responderProfile?.name ||
        theme.unitLabel,
      type: tracking?.serviceType || responderProfile?.serviceType || theme.color,
      status: tracking?.status || selectedDispatch?.status || 'AVAILABLE',
      organization:
        tracking?.unit?.organization ||
        responderProfile?.organization ||
        responderProfile?.jurisdiction ||
        theme.unitLabel,
      latitude: currentPoint.lat,
      longitude: currentPoint.lng,
      baseLatitude: basePoint?.lat ?? null,
      baseLongitude: basePoint?.lng ?? null,
    };
  }, [basePoint, currentPoint, responderProfile, selectedDispatch, selectedId, theme, tracking]);

  const referencePoints = useMemo(
    () =>
      basePoint
        ? [
            {
              id: 'fleet-base',
              name:
                responderProfile?.organization ||
                responderProfile?.name ||
                `${theme.unitLabel} Base`,
              label: 'Fleet Base',
              latitude: basePoint.lat,
              longitude: basePoint.lng,
              color: '#2563eb',
            },
          ]
        : [],
    [basePoint, responderProfile, theme.unitLabel],
  );

  const primaryRoute = routeSummary[0] || null;
  const lastUpdated =
    tracking?.unit?.location?.updatedAt ||
    tracking?.updatedAt ||
    selectedDispatch?.updatedAt ||
    null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadDispatches(), loadTracking()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 pb-8">
      <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className={`h-1.5 w-full ${theme.bgClass}`} />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Operational Tracking
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight text-slate-950">
              <Navigation className={`h-5 w-5 ${theme.textClass}`} />
              Live Response Tracking
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
              The blue reference marker is the fleet's fixed registered base. During an active dispatch, the live responder position becomes the route origin and is synchronized with Disaster Management.
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 self-start rounded-md border px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] sm:self-auto ${
              selectedId
                ? `${theme.lightBgClass} ${theme.textClass} ${theme.borderClass}`
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Signal className="h-3.5 w-3.5" />}
            {selectedId ? 'GPS transmitting' : 'Standby'}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Active Dispatch
            </span>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="">No active dispatch selected</option>
              {dispatches.map((dispatch) => (
                <option key={dispatch.id} value={dispatch.id}>
                  {dispatch.incident?.title || 'Emergency'} · {String(dispatch.status).replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-4 text-[9px] font-black uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-800">
              Response Route
            </p>
            <p className="mt-1 text-[9px] text-slate-500">
              {selectedDispatch?.incident?.title || 'Select an active dispatch to begin route tracking.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Fleet Base
            </span>
            {selectedId && (
              <>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  Live Unit
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-1 w-5 rounded-full bg-slate-500" />
                  Travelled
                </span>
                <span className="flex items-center gap-1.5 text-blue-700">
                  <span className="h-1 w-5 rounded-full bg-blue-600" />
                  Remaining
                </span>
              </>
            )}
            <span className="flex items-center gap-1.5 text-red-700">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
              Tourist / Incident
            </span>
          </div>
        </div>

        <div className="relative isolate z-0 h-[500px] w-full overflow-hidden">
          <AuthorityOperationsMap
            incidents={routeIncident ? [routeIncident] : []}
            units={routeUnit ? [routeUnit] : []}
            showRoutes={Boolean(selectedId)}
            routeUnitColor={theme.markerColor}
            referencePoints={referencePoints}
            onRouteSummary={setRouteSummary}
          />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TrackingMetric
          icon={Route}
          label="Distance Remaining"
          value={
            primaryRoute?.distanceText ||
            (tracking?.distanceRemainingM == null
              ? '—'
              : `${tracking.distanceRemainingM} m`)
          }
        />
        <TrackingMetric
          icon={Clock3}
          label="Estimated Arrival"
          value={primaryRoute?.durationText || 'Calculating'}
        />
        <TrackingMetric
          icon={Crosshair}
          label="Unit Position"
          value={
            currentPoint
              ? `${currentPoint.lat.toFixed(5)}, ${currentPoint.lng.toFixed(5)}`
              : 'Waiting for GPS'
          }
        />
        <TrackingMetric
          icon={MapPin}
          label="Last Update"
          value={lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Waiting for GPS'}
        />
      </div>
    </div>
  );
}

function TrackingMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4">
      <p className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-2 break-words text-xs font-black text-slate-900">{value}</p>
    </div>
  );
}
