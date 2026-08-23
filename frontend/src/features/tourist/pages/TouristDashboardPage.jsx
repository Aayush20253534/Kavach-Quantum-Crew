import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Users,
  XCircle,
} from 'lucide-react';

import { useTouristDashboardSummary } from '../../dashboard/api/dashboardQueries';
import { destinationService } from '../../destinations/api/destinationService';
import { groupService } from '../../groups/api/groupService';
import { MapComponent } from '../../tracking/components/MapComponent';
import { trackingService } from '../../tracking/api/trackingService';
import { findDangerZoneForTrip } from '../../tracking/utils/geofenceSafety';
import { useCreateTrip, useCurrentTrip } from '../../trips/api/tripQueries';
import { tripService } from '../../trips/api/tripService';

const unwrap = (value) => {
  if (value && Object.prototype.hasOwnProperty.call(value, 'data')) {
    return value.data;
  }
  return value;
};

export function TouristDashboardPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const userName = (user?.name?.trim() || user?.username || 'Tourist').split(/\s+/)[0];

  const { data: currentTripResponse } = useCurrentTrip();
  const currentTrip = unwrap(currentTripResponse);
  const {
    liveLocation: location,
    locationPermission: permission,
    setLocationLabel,
  } = useOutletContext();
  const locationError = permission === 'denied' ? 'Location permission denied' : '';
  const { data: summary, isLoading: summaryLoading } = useTouristDashboardSummary(location);
  const createTrip = useCreateTrip();

  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creatingLocation, setCreatingLocation] = useState(null);
  const [actionError, setActionError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [emergencyCounts, setEmergencyCounts] = useState({
    police: 0,
    hospitals: 0,
    fireStations: 0,
    total: 0,
  });
  const [dashboardSnapshot, setDashboardSnapshot] = useState(null);
  const [riskZones, setRiskZones] = useState([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;

    trackingService.getRiskZones()
      .then((data) => {
        if (cancelled) return;
        setRiskZones(data?.items || data || []);
      })
      .catch(() => {
        if (!cancelled) setRiskZones([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    destinationService.list({ featured: true, limit: 8 })
      .then((data) => setFeaturedDestinations(Array.isArray(data) ? data.filter((item) => item?.name) : []))
      .catch(() => setFeaturedDestinations([]));
  }, []);

  useEffect(() => {
    const query = searchText.trim();
    if (!query) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      destinationService.list({ search: query, limit: 8 })
        .then((data) => setSearchResults(Array.isArray(data) ? data.filter((item) => item?.name) : []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchText]);

  const createGroupForDestination = async (destination) => {
    setActionError('');
    setCreatingLocation(destination.id);

    try {
      const destinationName = String(destination?.name ?? '').trim();
      if (!destinationName) {
        throw new Error('The selected destination is missing a valid name.');
      }

      // Never decide from a possibly stale React Query snapshot. The backend/database
      // is authoritative for whether this tourist currently has an open trip.
      const refreshedTrip = await tripService.getCurrentTrip();
      let trip = refreshedTrip || null;

      if (trip) {
        const tripLocation = String(trip?.locationName ?? '').trim();
        const tripType = String(trip?.tripType ?? 'trip');
        const sameDestination =
          tripLocation.toLocaleLowerCase() === destinationName.toLocaleLowerCase();

        if (!sameDestination || tripType !== 'GROUP') {
          throw new Error(
            `You already have an open ${tripType.toLocaleLowerCase()} trip${
              tripLocation ? ` for ${tripLocation}` : ''
            }. Complete or cancel it before creating or joining another trip.`,
          );
        }
      } else {
        const plannedStartAt = new Date(Date.now() + 5 * 60 * 1000);
        const plannedEndAt = new Date(plannedStartAt.getTime() + 24 * 60 * 60 * 1000);
        const created = await createTrip.mutateAsync({
          locationName: destinationName,
          tripType: 'GROUP',
          plannedStartAt: plannedStartAt.toISOString(),
          plannedEndAt: plannedEndAt.toISOString(),
        });
        trip = unwrap(created);
      }

      try {
        await groupService.createGroupForTrip(trip.id);
      } catch (error) {
        // If the group already exists, the location selection is still valid.
        if (error.response?.data?.error?.code !== 'GROUP_ALREADY_EXISTS') throw error;
      }

      navigate('/tourist/groups/create', {
        state: { tripId: trip.id, destination: destinationName },
      });
    } catch (error) {
      setActionError(
        error.response?.data?.error?.message || error.message || 'Unable to create a group for this location.',
      );
    } finally {
      setCreatingLocation(null);
      setSearchText('');
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (dashboardSnapshot || summaryLoading || !summary || !location) return;
    setDashboardSnapshot({ summary });
  }, [dashboardSnapshot, summaryLoading, summary, location]);

  const frozenSummary = dashboardSnapshot?.summary;

  // Use the same geofence rule as the Trips / Live Map page. For a GROUP trip,
  // an overlapping danger geofence makes the whole group boundary dangerous,
  // even when the tourist marker itself is just outside that geofence.
  const liveDangerZone = useMemo(
    () =>
      findDangerZoneForTrip({
        location,
        zones: riskZones,
        trip: currentTrip,
      }),
    [location, riskZones, currentTrip],
  );
  const safetyIsDanger = Boolean(liveDangerZone);
  const safetyResolved = Boolean(location);

  const cards = useMemo(() => [
    {
      label: 'Total Tourists',
      value: !dashboardSnapshot ? '...' : (frozenSummary?.totalTourists ?? 0).toLocaleString('en-IN'),
      sub: 'Registered tourist users',
      icon: Users,
    },
    {
      label: 'Active Alerts',
      value: !dashboardSnapshot ? '...' : frozenSummary?.activeAlerts ?? 0,
      sub: 'Your unresolved safety alerts',
      icon: Bell,
    },
    {
      label: 'Safety Status',
      value: safetyResolved ? (safetyIsDanger ? 'Danger Zone' : 'Safe Zone') : 'Locating...',
      sub: safetyIsDanger
        ? liveDangerZone?.name || 'Danger geofence overlaps your trip safety area'
        : 'Outside all danger geofences',
      icon: safetyIsDanger ? AlertTriangle : ShieldCheck,
    },
    {
      label: 'Group Members',
      value: !dashboardSnapshot ? '...' : frozenSummary?.currentGroupMembers ?? 0,
      sub: frozenSummary?.currentTrip?.locationName ? `Current trip: ${frozenSummary.currentTrip.locationName}` : 'No open group trip',
      icon: Users,
    },
  ], [dashboardSnapshot, frozenSummary, safetyIsDanger, safetyResolved, liveDangerZone]);

  return (
    <div className="space-y-5 sm:space-y-7 max-w-[1240px] mx-auto pb-8 sm:pb-10 overflow-visible">
      <section className={`relative z-30 overflow-visible rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition-all duration-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-5">
          <div className="min-w-0">
            <h2 className="text-[19px] sm:text-[25px] font-black text-slate-950 tracking-tight">Welcome back, {userName}</h2>
            <p className="text-[11px] sm:text-[13px] text-slate-500 font-medium mt-1.5">Search a destination to create a group trip.</p>
          </div>
        </div>

        <div className="relative z-20">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl shadow-inner focus-within:bg-white focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-50 transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search destination"
              className="w-full h-12 sm:h-14 px-3 text-[13px] sm:text-[14px] font-semibold text-slate-900 outline-none bg-transparent placeholder:font-medium placeholder:text-slate-400"
            />
            {searching && <Loader2 className="w-4 h-4 mr-4 text-slate-400 animate-spin" />}
          </div>

          {searchText.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
              {!searching && searchResults.length === 0 && (
                <p className="p-4 text-[12px] text-slate-500">No configured destination found.</p>
              )}
              {searchResults.map((destination) => (
                <button
                  key={destination.id}
                  type="button"
                  disabled={Boolean(creatingLocation)}
                  onClick={() => createGroupForDestination(destination)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{destination.name}</p>
                      <p className="text-[11px] text-slate-500">{destination.state}, {destination.country}</p>
                    </div>
                  </div>
                  {creatingLocation === destination.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Create group</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {actionError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] font-medium text-red-700">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> {actionError}
          </div>
        )}
        {locationError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] font-medium text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Live location unavailable: {locationError}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const dangerCard = card.label === 'Safety Status' && safetyIsDanger;
          return (
            <div key={card.label} className={`group bg-white rounded-2xl p-4 sm:p-5 shadow-sm border ${dangerCard ? 'border-red-200 bg-red-50/40' : 'border-slate-200'} transition-all hover:-translate-y-0.5 hover:shadow-md`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${dangerCard ? 'text-red-600' : 'text-slate-500'}`} />
              </div>
              <h3 className={`text-[20px] sm:text-[24px] font-black tracking-tight leading-none ${dangerCard ? 'text-red-700' : 'text-slate-950'}`}>{card.value}</h3>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 mt-2 sm:mt-2.5 leading-relaxed line-clamp-2">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
            <Star className="w-4 h-4 text-[#e11d48]" strokeWidth={2.5} /> Top Destinations
          </h2>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {featuredDestinations.map((destination) => (
            <button
              key={destination.id}
              type="button"
              onClick={() => createGroupForDestination(destination)}
              disabled={Boolean(creatingLocation)}
              className="group text-left h-40 rounded-2xl border border-slate-200 bg-slate-900 relative overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all disabled:opacity-60"
              style={
                destination.imageUrl
                  ? {
                      backgroundImage: `url("${destination.imageUrl}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/55 to-slate-900/15" />
              <MapPin className="absolute right-3 top-3 w-8 h-8 text-white/25" />
              <div className="absolute inset-x-0 bottom-0 p-5 z-10">
                <h3 className="text-white text-[15px] font-black tracking-tight">{destination.name}</h3>
                <p className="text-slate-300 text-[10px] font-semibold mt-1">{destination.state}</p>
                <p className="text-red-200 text-[9px] font-black uppercase tracking-widest mt-2">Click to create group</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-[13px] sm:text-[15px] font-black text-slate-950 uppercase tracking-wide">Nearby Emergency Services</h2>
            <p className="text-[10px] sm:text-[11px] leading-4 text-slate-500 font-medium mt-1">Live Google Maps results within approximately 5 km of your current location.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700">
              P Police · {emergencyCounts.police}
            </span>
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700">
              H Hospital · {emergencyCounts.hospitals}
            </span>
            <span className="px-2 py-1 rounded bg-red-50 text-red-700">
              F Fire Station · {emergencyCounts.fireStations}
            </span>
            <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">
              Total · {emergencyCounts.total}
            </span>
          </div>
        </div>
        <div className="h-[390px] sm:h-[500px] relative bg-slate-100">
          <MapComponent
            currentLocation={location}
            showEmergencyServicesOnly
            onEmergencyCountsChange={setEmergencyCounts}
            onLocationLabelChange={setLocationLabel}
            className="w-full h-full absolute inset-0"
          />
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-[10px] text-emerald-800 font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        Safety status is SAFE everywhere except active risk geofences configured by a system administrator.
      </div>
    </div>
  );
}
