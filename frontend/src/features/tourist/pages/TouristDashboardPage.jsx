import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
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
import { useGeolocation } from '../../tracking/hooks/useGeolocation';
import { MapComponent } from '../../tracking/components/MapComponent';
import { useCreateTrip, useCurrentTrip } from '../../trips/api/tripQueries';

const unwrap = (value) => value?.data ?? value;

export function TouristDashboardPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const userName = (user?.name?.trim() || user?.username || 'Tourist').split(/\s+/)[0];

  const { data: currentTripResponse } = useCurrentTrip();
  const currentTrip = unwrap(currentTripResponse);
  const isTripActive = currentTrip?.status === 'ACTIVE';
  const { location, error: locationError, permission } = useGeolocation(currentTrip?.id, isTripActive);
  const { data: summary, isLoading: summaryLoading } = useTouristDashboardSummary(location);
  const createTrip = useCreateTrip();

  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creatingLocation, setCreatingLocation] = useState(null);
  const [actionError, setActionError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Waiting for live location');
  const [emergencyCounts, setEmergencyCounts] = useState({
    police: 0,
    hospitals: 0,
    fireStations: 0,
    total: 0,
  });

  useEffect(() => setMounted(true), []);

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

      let trip = currentTrip;

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

  const safety = summary?.safetyStatus?.level ?? (location ? 'SAFE' : 'UNKNOWN');
  const safetyIsDanger = safety === 'DANGER';

  useEffect(() => {
    if (permission === 'denied') {
      setLocationLabel('Location permission denied');
    } else if (!location) {
      setLocationLabel('Waiting for live location');
    }
  }, [location, permission]);

  const cards = useMemo(() => [
    {
      label: 'Total Tourists',
      value: summaryLoading ? '...' : (summary?.totalTourists ?? 0).toLocaleString('en-IN'),
      sub: 'Registered tourist users',
      icon: Users,
    },
    {
      label: 'Active Alerts',
      value: summaryLoading ? '...' : summary?.activeAlerts ?? 0,
      sub: 'Your unresolved safety alerts',
      icon: Bell,
    },
    {
      label: 'Safety Status',
      value: location ? (safetyIsDanger ? 'Danger Zone' : 'Safe Zone') : 'Locating...',
      sub: safetyIsDanger ? summary?.safetyStatus?.zone?.name || 'Inside admin-defined risk geofence' : 'Outside all danger geofences',
      icon: safetyIsDanger ? AlertTriangle : ShieldCheck,
    },
    {
      label: 'Group Members',
      value: summaryLoading ? '...' : summary?.currentGroupMembers ?? 0,
      sub: summary?.currentTrip?.locationName ? `Current trip: ${summary.currentTrip.locationName}` : 'No open group trip',
      icon: Users,
    },
  ], [summary, summaryLoading, location, safetyIsDanger]);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-8 overflow-visible">
      <section className={`transition-all duration-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[18px] font-black text-slate-900 uppercase tracking-wide">Tourist Safety Dashboard</h2>
            <p className="text-[12px] text-slate-500 font-medium mt-1">Welcome back, {userName}. Search a destination to start a group trip.</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <MapPin className="w-4 h-4 text-red-500" />
            <span>{locationLabel}</span>
          </div>
        </div>

        <div className="relative z-20">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search destination, e.g. Prayagraj, Lucknow, Kanpur, Delhi"
              className="w-full h-12 px-3 text-[13px] font-medium text-slate-900 outline-none bg-transparent placeholder:text-slate-400"
            />
            {searching && <Loader2 className="w-4 h-4 mr-4 text-slate-400 animate-spin" />}
          </div>

          {searchText.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const dangerCard = card.label === 'Safety Status' && safetyIsDanger;
          return (
            <div key={card.label} className={`bg-white rounded-lg p-4 shadow-sm border ${dangerCard ? 'border-red-300 bg-red-50/30' : 'border-slate-200'} transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                <Icon className={`w-4 h-4 ${dangerCard ? 'text-red-600' : 'text-slate-400'}`} />
              </div>
              <h3 className={`text-[20px] font-black tracking-tight leading-none ${dangerCard ? 'text-red-700' : 'text-slate-900'}`}>{card.value}</h3>
              <p className="text-[9px] font-semibold text-slate-500 mt-2 line-clamp-2">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Star className="w-4 h-4 text-[#e11d48]" strokeWidth={2.5} /> Top Destinations
          </h2>
          <Link to="/tourist/trips/create" className="text-[11px] font-bold text-[#e11d48] hover:text-[#be123c] flex items-center gap-1">Plan manually <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {featuredDestinations.map((destination) => (
            <button
              key={destination.id}
              type="button"
              onClick={() => createGroupForDestination(destination)}
              disabled={Boolean(creatingLocation)}
              className="group text-left h-32 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-4 relative overflow-hidden hover:-translate-y-0.5 transition-transform disabled:opacity-60"
            >
              <MapPin className="absolute right-3 top-3 w-8 h-8 text-white/10" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-white text-[13px] font-black uppercase tracking-wide">{destination.name}</h3>
                <p className="text-slate-300 text-[10px] font-semibold mt-1">{destination.state}</p>
                <p className="text-red-300 text-[9px] font-bold uppercase tracking-wider mt-2">Click to create group</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-wide">Nearby Emergency Services</h2>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Live Google Maps results within approximately 5 km of your current location.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider">
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
        <div className="h-[360px] relative bg-slate-100">
          <MapComponent
            currentLocation={location}
            showEmergencyServicesOnly
            onEmergencyCountsChange={setEmergencyCounts}
            onLocationLabelChange={setLocationLabel}
            className="w-full h-full absolute inset-0"
          />
        </div>
      </section>

      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        Safety status is SAFE everywhere except active risk geofences configured by a system administrator.
      </div>
    </div>
  );
}
