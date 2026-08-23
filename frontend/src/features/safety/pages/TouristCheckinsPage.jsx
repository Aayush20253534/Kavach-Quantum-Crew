import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  ServerCrash,
  ShieldCheck,
  X,
} from 'lucide-react';

import { tripService } from '../../trips/api/tripService';

const localDateTimeValue = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function TouristCheckinsPage() {
  const [trip, setTrip] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const currentTrip = await tripService.getCurrentTrip();
      if (!currentTrip || currentTrip.status !== 'ACTIVE') {
        setTrip(currentTrip || null);
        setCheckIns([]);
        return;
      }

      setTrip(currentTrip);
      const checks = await tripService.getCheckIns(currentTrip.id);
      setCheckIns(Array.isArray(checks) ? checks : checks?.items || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error?.message ||
          requestError?.message ||
          'Failed to load safety check-ins.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const minValue = useMemo(
    () => localDateTimeValue(new Date(Date.now() + 60_000)),
    [showModal],
  );

  const maxValue = useMemo(() => {
    const max24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tripEnd = trip?.plannedEndAt ? new Date(trip.plannedEndAt) : max24h;
    return localDateTimeValue(tripEnd < max24h ? tripEnd : max24h);
  }, [trip?.plannedEndAt, showModal]);

  const openSchedule = () => {
    setNewTime(minValue);
    setShowModal(true);
  };

  const handleSchedule = async (event) => {
    event.preventDefault();
    if (!trip?.id || !newTime) return;

    setBusy(true);
    try {
      await tripService.scheduleCheckIn(trip.id, new Date(newTime).toISOString());
      setShowModal(false);
      setNewTime('');
      await load();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Failed to schedule check-in.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async (checkInId) => {
    setBusy(true);
    try {
      await tripService.completeCheckIn(checkInId);
      await load();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Failed to complete check-in.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safety Protocols</p>
          <h1 className="text-[24px] font-black text-slate-900 flex items-center gap-2 mt-1">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Safety Check-ins
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Check-ins are available only during an active trip and must be scheduled 1 minute to 24 hours ahead, before the trip ends.
          </p>
        </div>

        {trip?.status === 'ACTIVE' && (
          <button
            type="button"
            onClick={openSchedule}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Schedule New
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border p-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : !trip || trip.status !== 'ACTIVE' ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h3 className="font-black">No Active Trip</h3>
          <p className="text-sm text-slate-500 mt-2">
            Start your planned trip before scheduling safety check-ins.
          </p>
        </div>
      ) : checkIns.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="font-black">No Check-ins Scheduled</h3>
          <button onClick={openSchedule} className="mt-5 px-5 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
            Create First Check-in
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {checkIns.map((check) => (
            <div key={check.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-black text-sm">
                  {new Date(check.dueAt).toLocaleString()}
                </p>
                <p className={`text-[10px] font-black uppercase mt-1 ${
                  check.status === 'COMPLETED'
                    ? 'text-emerald-600'
                    : check.status === 'MISSED'
                      ? 'text-red-600'
                      : 'text-indigo-600'
                }`}>
                  {check.status}
                </p>
              </div>

              {check.status === 'PENDING' && (
                <button
                  disabled={busy}
                  onClick={() => handleComplete(check.id)}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold uppercase"
                >
                  Confirm Safe
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-black">Schedule Check-in</h2>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSchedule} className="p-6">
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Check-in time
              </label>
              <input
                type="datetime-local"
                min={minValue}
                max={maxValue}
                required
                value={newTime}
                onChange={(event) => setNewTime(event.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
              />
              <p className="mt-2 text-[11px] text-slate-500">
                Latest allowed: {new Date(trip.plannedEndAt).toLocaleString()}
              </p>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-xs font-bold">
                  Cancel
                </button>
                <button disabled={busy} className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">
                  {busy ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
