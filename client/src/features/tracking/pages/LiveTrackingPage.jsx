import React, { useEffect, useMemo, useState } from 'react';
import { BatteryMedium, Loader2, Navigation, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { groupService } from '../../groups/api/groupService';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { trackingService } from '../api/trackingService';
import { MapComponent } from '../components/MapComponent';
import { findDangerZoneForTrip, GROUP_GEOFENCE_RADIUS_M } from '../utils/geofenceSafety';
import { useGeolocation } from '../hooks/useGeolocation';


const normalizeGroupLocations = (payload) => {
  const members = payload?.members || payload?.items || (Array.isArray(payload) ? payload : []);
  return members
    .filter((member) => member?.location)
    .map((member) => ({
      id: member.memberId || member.id,
      userId: member.userId,
      userName: member.user?.name || member.user?.username || 'Group member',
      lat: member.location.latitude,
      lng: member.location.longitude,
      stale: Boolean(member.location.stale),
      capturedAt: member.location.capturedAt,
    }))
    .filter((member) => Number.isFinite(member.lat) && Number.isFinite(member.lng));
};

export function LiveTrackingPage() {
  const { data: trip, isLoading } = useCurrentTrip();
  const isActive = trip?.status === 'ACTIVE';
  const { location, isTracking, permission, error: geoError } = useGeolocation(trip?.id, isActive);

  const [zones, setZones] = useState([]);
  const [group, setGroup] = useState(null);
  const [memberLocations, setMemberLocations] = useState([]);
  const [battery, setBattery] = useState(null);

  useEffect(() => {
    trackingService.getRiskZones().then((data) => setZones(data?.items || data || [])).catch(() => setZones([]));
  }, []);

  useEffect(() => {
    if (!trip || trip.tripType !== 'GROUP') {
      setGroup(null);
      setMemberLocations([]);
      return undefined;
    }

    let cancelled = false;
    let timer;

    const loadGroup = async () => {
      try {
        const g = await groupService.getGroupForTrip(trip.id);
        if (cancelled) return;
        setGroup(g);

        if (trip.status !== 'ACTIVE' || !g?.id) {
          setMemberLocations([]);
          return;
        }

        const data = await trackingService.getLatestLocations(g.id);
        if (!cancelled) setMemberLocations(normalizeGroupLocations(data));
      } catch {
        if (!cancelled) setMemberLocations([]);
      }
    };

    loadGroup();
    if (trip.status === 'ACTIVE') timer = window.setInterval(loadGroup, 10000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [trip?.id, trip?.tripType, trip?.status]);

  useEffect(() => {
    let batteryManager;
    let updateBattery;
    if (navigator.getBattery) {
      navigator.getBattery().then((value) => {
        batteryManager = value;
        updateBattery = () => setBattery(Math.round(value.level * 100));
        updateBattery();
        value.addEventListener('levelchange', updateBattery);
      }).catch(() => {});
    }
    return () => {
      if (batteryManager && updateBattery) batteryManager.removeEventListener('levelchange', updateBattery);
    };
  }, []);

  const currentZone = useMemo(
    () => findDangerZoneForTrip({ location, zones, trip }),
    [zones, location, trip],
  );

  const onlineMemberCount = useMemo(
    () => memberLocations.filter((member) => !member.stale).length,
    [memberLocations],
  );
  const totalMemberCount = group?.members?.length || 0;

  if (isLoading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin" /></div>;

  if (!trip || trip.status !== 'ACTIVE') {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Navigation className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-950">Start a trip to use Live Map</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
            Live Map, location sharing and safety-zone monitoring are available only after you start a trip as team leader or join an active trip.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to="/tourist/trips/create" className="rounded-xl bg-rose-600 px-4 py-3 text-[11px] font-black text-white">
              Create a Trip
            </Link>
            <Link to="/tourist/groups/join" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black text-slate-800">
              Join a Trip
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 pb-8 sm:pb-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Metric label="Tracking" value={isTracking && isActive ? 'Active' : isActive ? 'Waiting GPS' : 'Trip not started'} icon={Navigation} />
        <Metric
          label="Current zone"
          value={currentZone ? `Danger Zone · ${currentZone.name}` : 'Outside danger zones'}
          icon={ShieldCheck}
          danger={Boolean(currentZone)}
        />
        <Metric
          label="Group members online"
          value={trip.tripType === 'GROUP' ? `${onlineMemberCount}/${totalMemberCount}` : 'Solo trip'}
          icon={Users}
        />
        <Metric label="Battery" value={battery == null ? 'Unavailable' : `${battery}%`} icon={BatteryMedium} />
      </div>

      {(geoError || permission === 'denied') && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs sm:text-sm">
          {geoError || 'Location permission denied'}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-[10px] sm:text-[11px] font-semibold text-slate-600">
        <Navigation className="w-3.5 h-3.5 shrink-0" />
        Use two fingers to move the map. Active danger zones are shown in red, and group members are shown inside a 500 m geofence.
      </div>

      {currentZone && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-red-800 shadow-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-[11px] sm:text-xs font-black">Danger zone intersects your trip boundary</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] leading-4 text-red-700">
              {currentZone.name || 'An active danger geofence'} overlaps the group safety area. The danger zone takes visual priority on the map.
            </p>
          </div>
        </div>
      )}

      <div className="h-[220px] sm:h-[340px] lg:h-[clamp(340px,calc(100dvh-405px),430px)] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        {location ? (
          <MapComponent
            currentLocation={location}
            groupLocations={memberLocations}
            groupGeofenceRadiusM={trip.tripType === 'GROUP' ? GROUP_GEOFENCE_RADIUS_M : 0}
            riskZones={zones}
            mapGestureHandling="cooperative"
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-[11px] sm:text-xs font-bold">Locating you...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, danger = false }) {
  return (
    <div className={`border rounded-xl p-3 sm:p-4 transition-colors ${
      danger ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
    }`}>
      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${danger ? 'text-red-600' : 'text-slate-400'}`} />
      <p className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-black mt-1.5 sm:mt-2 ${
        danger ? 'text-red-500' : 'text-slate-400'
      }`}>{label}</p>
      <p className={`text-[11px] sm:text-sm font-bold mt-1 leading-snug ${danger ? 'text-red-800' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}
