import React, { useEffect, useState } from 'react';
import { Calendar, Compass, Loader2, MapPin, Search, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { destinationService } from '../../destinations/api/destinationService';
import { groupService } from '../../groups/api/groupService';
import { tripService } from '../api/tripService';

const toIso = (value) => new Date(value).toISOString();

export function CreateTripPage() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [search, setSearch] = useState('');
  const [locationName, setLocationName] = useState('');
  const [tripType, setTripType] = useState('SOLO');
  const [plannedStartAt, setStart] = useState('');
  const [plannedEndAt, setEnd] = useState('');
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

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const trip = await tripService.createTrip({
        locationName: locationName.trim(),
        tripType,
        plannedStartAt: toIso(plannedStartAt),
        plannedEndAt: toIso(plannedEndAt),
      });

      if (tripType === 'GROUP') {
        await groupService.createGroupForTrip(trip.id);
      }

      navigate('/tourist/trips/current', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Could not create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Compass className="w-6 h-6 text-rose-600" /> Plan a Trip
        </h1>
        <p className="text-sm text-slate-500 mt-1">Trip, tracking and group data are stored in the real backend.</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search available destinations"
              className="w-full outline-none text-sm"
            />
          </div>

          {destLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {destinations.map((destination) => (
                <button
                  type="button"
                  key={destination.id || destination.name}
                  onClick={() => setLocationName(destination.name)}
                  className={`text-left p-4 rounded-xl border transition ${
                    locationName === destination.name
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-black text-sm text-slate-900">{destination.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{destination.state || destination.country || 'Destination'}</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-5">
            <label className="text-xs font-bold text-slate-500">Destination / area</label>
            <input
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
              placeholder="Enter destination"
            />
          </div>
        </div>

        <form onSubmit={submit} className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500">Trip type</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['SOLO', 'GROUP'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setTripType(type)}
                  className={`p-3 rounded-lg border font-bold text-xs ${
                    tripType === type ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'
                  }`}
                >
                  {type === 'GROUP' ? <Users className="w-4 h-4 inline mr-1" /> : <ShieldCheck className="w-4 h-4 inline mr-1" />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-500">Start</span>
            <input required type="datetime-local" value={plannedStartAt} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-500">End</span>
            <input required type="datetime-local" value={plannedEndAt} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-3 text-sm" />
          </label>

          <button disabled={loading} className="w-full rounded-lg bg-rose-600 text-white py-3 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Trip
          </button>
        </form>
      </div>
    </div>
  );
}
