import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';

import { tripService } from '../api/tripService';

const dateText = (value) =>
  value
    ? new Date(value).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

const durationText = (minutes) => {
  if (minutes == null) return 'Not available';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} min`;
  if (!mins) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

export function TripHistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    tripService.getTripHistory({ limit: 50 })
      .then((data) => setItems(data?.items || data || []))
      .catch((e) =>
        setError(e?.response?.data?.error?.message || 'Unable to load trip history'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex py-24 justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-black">Trip History</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Completed and cancelled journeys with their recorded trip summary.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No previous trips.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((trip) => {
            const actualEnd = trip.endedAt || trip.cancelledAt;
            return (
              <article
                key={trip.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-rose-500" />
                      <h2 className="truncate text-sm sm:text-base font-black text-slate-950">
                        {trip.locationName}
                      </h2>
                    </div>
                    <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {trip.tripType} trip
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                      trip.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {trip.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
                  <div className="bg-white p-4">
                    <Users className="h-4 w-4 text-slate-400" />
                    <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Group Members
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {trip.groupMemberCount || (trip.tripType === 'SOLO' ? 1 : 0)}
                    </p>
                  </div>

                  <div className="bg-white p-4">
                    <AlertTriangle className="h-4 w-4 text-slate-400" />
                    <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Incidents
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {trip.incidentCount ?? 0}
                    </p>
                  </div>

                  <div className="bg-white p-4">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Trip Duration
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {durationText(trip.actualDurationMinutes)}
                    </p>
                  </div>

                  <div className="bg-white p-4">
                    <CalendarClock className="h-4 w-4 text-slate-400" />
                    <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Planned Duration
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {durationText(trip.plannedDurationMinutes)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 px-4 py-4 text-[10px] sm:grid-cols-2 sm:px-5 sm:text-[11px]">
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="font-black uppercase tracking-wider text-slate-400">Started</p>
                    <p className="mt-1.5 font-bold text-slate-700">
                      {dateText(trip.startedAt || trip.plannedStartAt)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="font-black uppercase tracking-wider text-slate-400">
                      {trip.status === 'CANCELLED' ? 'Cancelled' : 'Completed'}
                    </p>
                    <p className="mt-1.5 font-bold text-slate-700">
                      {dateText(actualEnd)}
                    </p>
                  </div>
                </div>

                {trip.completedEarly && (
                  <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-[10px] font-semibold text-amber-800 sm:px-5 sm:text-[11px]">
                    Completed early on {dateText(trip.endedAt)}, approximately{' '}
                    {durationText(trip.earlyByMinutes)} before the planned end time.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
