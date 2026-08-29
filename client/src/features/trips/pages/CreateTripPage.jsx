import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, Loader2, Search, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { destinationService } from '../../destinations/api/destinationService';
import { groupService } from '../../groups/api/groupService';
import { tripService } from '../api/tripService';

const toIso = (value) => new Date(value).toISOString();
const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function CreateTripPage() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const preselectedDestination = routeLocation.state?.destination || null;
  const initialDestinationName = String(preselectedDestination?.name || '').trim();
  const initialTripType = routeLocation.state?.tripType === 'GROUP' ? 'GROUP' : 'SOLO';
  const existingTripId = routeLocation.state?.existingTripId || null;
  const existingTripLocked = Boolean(routeLocation.state?.groupLocked);

  const [destinations, setDestinations] = useState([]);
  const [search, setSearch] = useState(initialDestinationName);
  const [locationName, setLocationName] = useState(initialDestinationName);
  const [destinationSelected, setDestinationSelected] = useState(Boolean(initialDestinationName));
  const [tripType, setTripType] = useState(initialTripType);
  const [plannedStartAt, setStart] = useState(toLocalInput(routeLocation.state?.plannedStartAt));
  const [plannedEndAt, setEnd] = useState(toLocalInput(routeLocation.state?.plannedEndAt));
  const [step, setStep] = useState(routeLocation.state?.startAtMode ? 'mode' : 'details');
  const [loading, setLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        setDestLoading(true);
        const result = await destinationService.list({ search: search || undefined, limit: 12 });
        if (alive) setDestinations(result?.items || result || []);
      } catch (e) {
        if (alive) setError(e?.response?.data?.error?.message || 'Could not load destinations');
      } finally {
        if (alive) setDestLoading(false);
      }
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [search]);

  const validateDraft = () => {
    if (!locationName.trim() || !destinationSelected) return 'Choose a destination from the available options.';
    if (!plannedStartAt || !plannedEndAt) return 'Choose both the start and end date.';
    if (new Date(plannedEndAt) <= new Date(plannedStartAt)) return 'End date must be after start date.';
    return '';
  };

  const tripDraft = () => ({
    city: locationName.trim(),
    tripType,
    check_in: plannedStartAt.slice(0, 10),
    check_out: plannedEndAt.slice(0, 10),
    plannedStartAt: toIso(plannedStartAt),
    plannedEndAt: toIso(plannedEndAt),
    existingTripId,
  });

  const goNext = async (event) => {
    event.preventDefault();
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');

    if (existingTripId) {
      if (tripType === 'GROUP' && !existingTripLocked) {
        setError('Lock the group before choosing how to plan the trip.');
        return;
      }
      setStep('mode');
      return;
    }

    if (tripType === 'SOLO') {
      setStep('mode');
      return;
    }

    setLoading(true);
    try {
      const trip = await tripService.createTrip({
        locationName: locationName.trim(),
        tripType: 'GROUP',
        plannedStartAt: toIso(plannedStartAt),
        plannedEndAt: toIso(plannedEndAt),
      });
      await groupService.createGroupForTrip(trip.id);
      navigate('/tourist/trips/current', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Could not create the group trip');
    } finally {
      setLoading(false);
    }
  };

  const startTripNow = async (tripId) => {
    await tripService.grantConsent(tripId, 'LOCATION_TRACKING');
    await tripService.grantConsent(tripId, 'EMERGENCY_SHARING');
    return tripService.startTrip(tripId);
  };

  const createWithoutAI = async () => {
    setLoading(true);
    setError('');
    try {
      let tripId = existingTripId;
      if (!tripId) {
        const trip = await tripService.createTrip({
          locationName: locationName.trim(),
          tripType,
          plannedStartAt: toIso(plannedStartAt),
          plannedEndAt: toIso(plannedEndAt),
        });
        tripId = trip.id;
      }

      await startTripNow(tripId);

      navigate('/tourist/trips/current', {
        replace: true,
        state: { openGroupView: tripType === 'GROUP' },
      });
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Could not start this trip without AI');
    } finally {
      setLoading(false);
    }
  };

  const planWithAI = () => {
    navigate('/tourist/trips/ai-planner', {
      state: { tripDraft: tripDraft(), autoGenerate: true, existingTripId },
    });
  };

  if (step === 'mode') {
    return (
      <div className="max-w-4xl mx-auto pb-8 space-y-4">
        <button
          type="button"
          onClick={() => existingTripId ? navigate('/tourist/trips/current') : setStep('details')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div>
          <h1 className="text-3xl font-black text-slate-900">How do you want to plan this trip?</h1>
          <p className="mt-2 text-sm text-slate-500">
            {locationName} · {new Date(plannedStartAt).toLocaleString()} to {new Date(plannedEndAt).toLocaleString()}
          </p>
          {tripType === 'GROUP' && existingTripLocked && (
            <p className="mt-2 text-xs font-bold text-emerald-700">Group locked. Membership is final and planning is now enabled.</p>
          )}
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        <div className="grid md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={planWithAI}
            className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400 hover:shadow-md transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-slate-900">Plan with AI</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Generate the itinerary and hotel recommendations from the destination and dates already selected.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-slate-900">Generate plan <ArrowRight className="w-4 h-4" /></span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={createWithoutAI}
            className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-rose-300 hover:shadow-md transition-all disabled:opacity-60"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3"><Compass className="w-5 h-5" /></div>
            <h2 className="text-base font-black text-slate-900">Plan without AI</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Start the trip immediately without an AI itinerary. AI planning is locked once the trip starts.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-rose-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Start without AI <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-8 space-y-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Compass className="w-6 h-6 text-rose-600" /> Plan a Trip</h1>
        <p className="text-sm text-slate-500 mt-1">Destination, dates and SOLO/GROUP stay together here.</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {initialDestinationName && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          Destination: <span className="font-black">{initialDestinationName}</span>{initialTripType === 'GROUP' ? ' · Group trip' : ''}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Search className="w-4 h-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search available destinations" className="w-full outline-none text-sm" /></div>
          {destLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {destinations.map((destination) => (
                <button type="button" key={destination.id || destination.name} disabled={Boolean(existingTripId)} onClick={() => { setLocationName(destination.name); setDestinationSelected(true); setError(''); }} className={`text-left p-3 rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-60 ${locationName === destination.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <p className="font-black text-sm text-slate-900">{destination.name}</p><p className="text-xs text-slate-500 mt-1">{destination.state || destination.country || 'Destination'}</p>
                </button>
              ))}
            </div>
          )}
          <div className="mt-5">
            <label className="text-xs font-bold text-slate-500">Selected destination</label>
            <div className={`mt-1 w-full border rounded-lg px-4 py-3 text-sm ${locationName ? 'border-emerald-200 bg-emerald-50 text-slate-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              {locationName || 'Select one of the destinations above'}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Destinations must be selected from the available list. Free-text trip destinations are disabled.</p>
          </div>
        </div>

        <form onSubmit={goNext} className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500">Trip type</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['SOLO', 'GROUP'].map((type) => (
                <button type="button" disabled={Boolean(existingTripId)} key={type} onClick={() => setTripType(type)} className={`p-3 rounded-lg border font-bold text-xs disabled:cursor-not-allowed disabled:opacity-60 ${tripType === type ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}>
                  {type === 'GROUP' ? <Users className="w-4 h-4 inline mr-1" /> : <ShieldCheck className="w-4 h-4 inline mr-1" />}{type}
                </button>
              ))}
            </div>
          </div>
          <label className="block"><span className="text-xs font-bold text-slate-500">Start</span><input required disabled={Boolean(existingTripId)} type="datetime-local" value={plannedStartAt} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-3 text-sm disabled:bg-slate-50" /></label>
          <label className="block"><span className="text-xs font-bold text-slate-500">End</span><input required disabled={Boolean(existingTripId)} type="datetime-local" value={plannedEndAt} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-3 text-sm disabled:bg-slate-50" /></label>

          {tripType === 'GROUP' && !existingTripId && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-5 text-slate-600">
              Next creates the group and blockchain IDs first. Add members, lock the group, then planning choices become available.
            </div>
          )}

          <button disabled={loading} className="w-full rounded-lg bg-rose-600 text-white py-3 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Next <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
