import React, { useEffect, useMemo, useState } from 'react';
import { BatteryMedium, Loader2, Navigation, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { groupService } from '../../groups/api/groupService';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { trackingService } from '../api/trackingService';
import { MapComponent } from '../components/MapComponent';
import { useGeolocation } from '../hooks/useGeolocation';

const GROUP_GEOFENCE_RADIUS_M = 500;

const metersBetween = (a, b) => {
  const R = 6371000;
  const toRad = (v) => v * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const isDangerZone = (zone) =>
  zone?.active !== false &&
  (zone?.type === 'RISK' || zone?.severity === 'HIGH' || zone?.severity === 'CRITICAL');

const zonePolygon = (zone) => {
  const coordinates = zone?.polygon || zone?.coordinates;
  if (!Array.isArray(coordinates)) return [];
  return coordinates
    .map((point) => Array.isArray(point)
      ? { lat: Number(point[0]), lng: Number(point[1]) }
      : { lat: Number(point?.latitude ?? point?.lat), lng: Number(point?.longitude ?? point?.lng) })
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
};

const pointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = ((a.lng > point.lng) !== (b.lng > point.lng))
      && point.lat < ((b.lat - a.lat) * (point.lng - a.lng)) / ((b.lng - a.lng) || Number.EPSILON) + a.lat;
    if (crosses) inside = !inside;
  }
  return inside;
};

const pointToSegmentMeters = (point, a, b) => {
  const latScale = 111320;
  const lngScale = 111320 * Math.cos((point.lat * Math.PI) / 180);
  const ax = (a.lng - point.lng) * lngScale;
  const ay = (a.lat - point.lat) * latScale;
  const bx = (b.lng - point.lng) * lngScale;
  const by = (b.lat - point.lat) * latScale;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared)) : 0;
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.sqrt(x * x + y * y);
};

const groupBoundaryIntersectsDangerZone = (center, radiusM, zone) => {
  if (!center || !isDangerZone(zone)) return false;

  const geometryType = zone.geometryType || zone.type;
  if (geometryType === 'CIRCLE') {
    const latitude = Number(zone.latitude ?? zone.center?.lat);
    const longitude = Number(zone.longitude ?? zone.center?.lng);
    const zoneRadius = Number(zone.radiusM ?? zone.radius);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(zoneRadius)) return false;
    return metersBetween(center, { lat: latitude, lng: longitude }) <= radiusM + zoneRadius;
  }

  if (geometryType === 'POLYGON') {
    const polygon = zonePolygon(zone);
    if (polygon.length < 3) return false;
    if (pointInPolygon(center, polygon)) return true;
    return polygon.some((point, index) =>
      pointToSegmentMeters(center, point, polygon[(index + 1) % polygon.length]) <= radiusM
    );
  }

  return false;
};

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

  const currentZone = useMemo(() => {
    if (!location) return null;
    const point = { lat: location.lat, lng: location.lng };
    const safetyRadius = trip?.tripType === 'GROUP' ? GROUP_GEOFENCE_RADIUS_M : 0;

    return zones.find((zone) => {
      if (!isDangerZone(zone)) return false;
      if (safetyRadius > 0) {
        return groupBoundaryIntersectsDangerZone(point, safetyRadius, zone);
      }
      return groupBoundaryIntersectsDangerZone(point, 0, zone);
    }) || null;
  }, [zones, location, trip?.tripType]);

  const onlineMemberCount = useMemo(
    () => memberLocations.filter((member) => !member.stale).length,
    [memberLocations],
  );
  const totalMemberCount = group?.members?.length || 0;

  if (isLoading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin" /></div>;

  if (!trip) {
    return (
      <div className="max-w-xl mx-auto py-12 sm:py-16 px-5 text-center bg-white border rounded-2xl">
        <h2 className="font-black text-lg sm:text-xl">No current trip</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">Create a trip before using live trip tracking.</p>
        <Link to="/tourist/trips/create" className="inline-block mt-5 px-5 py-2.5 bg-rose-600 text-white rounded-lg text-[11px] font-black">Create Trip</Link>
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
