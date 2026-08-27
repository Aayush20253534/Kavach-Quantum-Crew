import React, { useEffect, useMemo, useState } from 'react';
import { BatteryMedium, Loader2, Navigation, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { groupService } from '../../groups/api/groupService';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { trackingService } from '../api/trackingService';
import { emergencyServicesApi } from '../../emergency-services/api/emergencyServicesApi';
import { MapComponent } from '../components/MapComponent';
import { findDangerZoneForTrip, GROUP_GEOFENCE_RADIUS_M } from '../utils/geofenceSafety';
import { useGeolocation } from '../hooks/useGeolocation';


const MEMBER_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4f46e5'];

const memberColor = (member, index) =>
  member?.role === 'LEADER' ? '#dc2626' : MEMBER_COLORS[index % MEMBER_COLORS.length];

const normalizeGroupLocations = (payload) => {
  const members = payload?.members || payload?.items || (Array.isArray(payload) ? payload : []);
  return members
    .map((member, index) => ({
      id: member.memberId || member.id,
      userId: member.userId,
      userName: member.user?.name || member.user?.username || 'Group member',
      role: member.role,
      color: memberColor(member, index),
      lat: member.location?.latitude,
      lng: member.location?.longitude,
      stale: !member.location || Boolean(member.location.stale),
      capturedAt: member.location?.capturedAt ?? null,
    }))
    .filter((member) => Number.isFinite(member.lat) && Number.isFinite(member.lng));
};

export function LiveTrackingPage() {
  const { user } = useSelector((state) => state.auth);
  const { data: trip, isLoading } = useCurrentTrip();
  const isActive = trip?.status === 'ACTIVE';
  const { location, isTracking, permission, error: geoError, pingError } = useGeolocation(trip?.id, isActive);

  const [zones, setZones] = useState([]);
  const [group, setGroup] = useState(null);
  const [memberLocations, setMemberLocations] = useState([]);
  const [battery, setBattery] = useState(null);
  const [trackingConsentReady, setTrackingConsentReady] = useState(false);
  const [fleetResponses, setFleetResponses] = useState([]);
  const [fleetError, setFleetError] = useState('');

  useEffect(() => {
    trackingService.getRiskZones().then((data) => setZones(data?.items || data || [])).catch(() => setZones([]));
  }, []);

  useEffect(() => {
    if (!trip?.id || trip.status !== 'ACTIVE') {
      setTrackingConsentReady(false);
      return undefined;
    }

    let cancelled = false;

    // Existing members who joined before tracking-consent synchronization was
    // added are repaired here. This is idempotent on the backend.
    trackingService
      .grantConsent(trip.id)
      .then(() => {
        if (!cancelled) setTrackingConsentReady(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setTrackingConsentReady(false);
          console.error('Unable to enable group location sharing', error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [trip?.id, trip?.status]);

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
    if (trip.status === 'ACTIVE') timer = window.setInterval(loadGroup, 5000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [trip?.id, trip?.tripType, trip?.status]);

  useEffect(() => {
    if (!trip?.id || trip.status !== 'ACTIVE') {
      setFleetResponses([]);
      setFleetError('');
      return undefined;
    }

    let cancelled = false;
    let timer;

    const loadFleetResponses = async () => {
      try {
        const dispatchResponse = await emergencyServicesApi.getTouristDispatches();
        const dispatches = dispatchResponse?.data?.data || [];

        const activeDispatches = dispatches.filter(
          (dispatch) =>
            !['COMPLETED', 'CANCELLED'].includes(
              String(dispatch.status || '').toUpperCase(),
            ),
        );

        const snapshots = await Promise.all(
          activeDispatches.map(async (dispatch) => {
            try {
              const response = await emergencyServicesApi.getTracking(dispatch.id);
              return response?.data?.data || null;
            } catch {
              return null;
            }
          }),
        );

        if (!cancelled) {
          setFleetResponses(snapshots.filter(Boolean));
          setFleetError('');
        }
      } catch (error) {
        if (!cancelled) {
          setFleetResponses([]);
          setFleetError(
            error?.response?.data?.error?.message ||
              'Unable to synchronize active emergency response.',
          );
        }
      }
    };

    loadFleetResponses();
    timer = window.setInterval(loadFleetResponses, 5000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [trip?.id, trip?.status]);

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

  const totalMemberCount = group?.members?.length || 0;

  const memberStatuses = useMemo(() => {
    if (!group?.members?.length) return [];
    const locationByUser = new Map(memberLocations.map((member) => [member.userId, member]));
    return group.members.map((member, index) => {
      const live = locationByUser.get(member.userId);
      const isCurrentUser = member.userId === user?.id;
      const active =
        isCurrentUser && trackingConsentReady && isTracking
          ? true
          : Boolean(live && !live.stale);

      return {
        userId: member.userId,
        name: member.user?.name || member.user?.username || 'Group member',
        role: member.role,
        color: live?.color || memberColor(member, index),
        active,
        capturedAt:
          isCurrentUser && location?.timestamp
            ? new Date(location.timestamp).toISOString()
            : live?.capturedAt ?? null,
      };
    });
  }, [group?.members, isTracking, location?.timestamp, memberLocations, trackingConsentReady, user?.id]);

  const onlineMemberCount = useMemo(
    () => memberStatuses.filter((member) => member.active).length,
    [memberStatuses],
  );

  const currentMemberStyle = useMemo(() => {
    const index = group?.members?.findIndex((member) => member.userId === user?.id) ?? -1;
    if (index < 0) return { color: '#2563eb', role: null };
    const member = group.members[index];
    return { color: memberColor(member, index), role: member.role };
  }, [group?.members, user?.id]);

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
        <Metric
          label="Tracking"
          value={
            !isActive
              ? 'Trip not started'
              : !trackingConsentReady
                ? 'Enabling sharing'
                : isTracking
                  ? 'Active'
                  : 'Waiting GPS'
          }
          icon={Navigation}
        />
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

      {(geoError || pingError || permission === 'denied') && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs sm:text-sm">
          {geoError || pingError || 'Location permission denied'}
        </div>
      )}

      {fleetError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 sm:text-sm">
          {fleetError}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-[10px] sm:text-[11px] font-semibold text-slate-600">
        <Navigation className="w-3.5 h-3.5 shrink-0" />
        {fleetResponses.length
          ? 'Use two fingers to move the map. Group members, danger zones and the active emergency fleet response are shown together.'
          : 'Use two fingers to move the map. Active danger zones are shown in red, and group members are shown inside a 500 m geofence.'}
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
            currentMarkerColor={currentMemberStyle.color}
            currentMarkerTitle={currentMemberStyle.role === 'LEADER' ? 'Team leader · Active' : 'Your live location · Active'}
            groupLocations={memberLocations.filter((member) => member.userId !== user?.id)}
            fleetResponses={fleetResponses}
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

      {fleetResponses.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                Active emergency response
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Responding fleet and route are overlaid on your existing group map.
              </p>
            </div>

            <span className="text-[10px] font-black text-slate-500">
              {fleetResponses.length} responding
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              Live fleet
            </span>

            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-1 w-5 rounded-full bg-slate-500" />
              Travelled
            </span>

            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="h-1 w-5 rounded-full bg-blue-600" />
              Remaining road
            </span>

            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="tracking-[0.15em]">•••</span>
              Off-road
            </span>
          </div>
        </div>
      )}

      {trip.tripType === 'GROUP' && memberStatuses.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-800">Live group status</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Each member keeps a distinct map color; the team leader is always red.</p>
            </div>
            <span className="text-[10px] font-black text-slate-500">{onlineMemberCount}/{totalMemberCount} active</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {memberStatuses.map((member) => (
              <div key={member.userId} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: member.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-black text-slate-900">
                    {member.name}{member.role === 'LEADER' ? ' · Leader' : ''}
                  </p>
                  <p className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${member.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {member.active ? 'Active' : 'Offline / stale'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
