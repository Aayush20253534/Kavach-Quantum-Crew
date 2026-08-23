import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, CheckCircle2, Copy, Loader2, MapPin, Play, ShieldCheck, Users, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { groupService } from '../../groups/api/groupService';
import { tripService } from '../api/tripService';

const dateText = (value) => value ? new Date(value).toLocaleString() : '—';

export function CurrentTripPage() {
  const { user } = useSelector((state) => state.auth);
  const [trip, setTrip] = useState(null);
  const [group, setGroup] = useState(null);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const current = await tripService.getCurrentTrip();
      setTrip(current || null);
      if (current?.tripType === 'GROUP') {
        try { setGroup(await groupService.getGroupForTrip(current.id)); } catch { setGroup(null); }
      } else {
        setGroup(null);
      }
    } catch (e) {
      if (e?.response?.status === 404) setTrip(null);
      else setError(e?.response?.data?.error?.message || 'Unable to load current trip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async (name, action) => {
    setBusy(name);
    setError('');
    try { await action(); await load(); }
    catch (e) { setError(e?.response?.data?.error?.message || e.message || 'Action failed'); }
    finally { setBusy(''); }
  };

  const start = () => run('start', async () => {
    await tripService.grantConsent(trip.id, 'LOCATION_TRACKING');
    await tripService.grantConsent(trip.id, 'EMERGENCY_SHARING');
    if (!trip.safetyId?.active) await tripService.issueSafetyId(trip.id);
    await tripService.startTrip(trip.id);
  });

  const createInvite = async () => {
    setBusy('invite');
    try { setInvite(await groupService.createInvitation(group.id, 60)); }
    catch (e) { setError(e?.response?.data?.error?.message || 'Could not create invitation'); }
    finally { setBusy(''); }
  };

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const isOwner = trip?.touristId === user?.id;

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center bg-white border border-slate-200 rounded-2xl">
        <MapPin className="w-10 h-10 mx-auto text-slate-300" />
        <h2 className="mt-4 text-xl font-black">No current trip</h2>
        <p className="text-sm text-slate-500 mt-2">Plan a trip to enable tracking, groups, check-ins and SOS.</p>
        <Link to="/tourist/trips/create" className="inline-block mt-6 px-6 py-3 bg-rose-600 text-white rounded-lg text-xs font-black uppercase">Plan Trip</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-rose-600">{trip.status}</span>
            <h1 className="text-2xl font-black mt-1">{trip.locationName}</h1>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p><Calendar className="w-4 h-4 inline mr-2" />{dateText(trip.plannedStartAt)} → {dateText(trip.plannedEndAt)}</p>
              <p><Users className="w-4 h-4 inline mr-2" />{trip.tripType}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner && trip.status === 'PLANNED' && (
              <>
                <button onClick={start} disabled={busy} className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center gap-2">
                  <Play className="w-4 h-4" /> Start Trip
                </button>
                <button onClick={() => run('cancel', () => tripService.cancelTrip(trip.id))} disabled={busy} className="px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-xs font-black">
                  Cancel
                </button>
              </>
            )}
            {isOwner && trip.status === 'ACTIVE' && (
              <button onClick={() => run('complete', () => tripService.completeTrip(trip.id))} disabled={busy} className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Complete
              </button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-7">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Safety ID</p>
            <p className="mt-1 font-mono text-sm text-slate-800">{trip.safetyId?.publicId || 'Issued automatically before start'}</p>
            <p className="text-[10px] text-indigo-600 mt-2">Blockchain proof: mock / not connected</p>
          </div>
          <Link to="/tourist/checkins" className="p-4 bg-slate-50 rounded-xl">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Safety Check-ins</p>
            <p className="mt-1 font-bold text-sm">Open check-in schedule →</p>
          </Link>
        </div>
      </div>

      {trip.tripType === 'GROUP' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-black">Trip Group</h2>
              <p className="text-xs text-slate-500 mt-1">{group?.members?.length || 0} active member(s)</p>
            </div>
            {group && (
              <button onClick={createInvite} disabled={busy === 'invite'} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold">
                Create Invite
              </button>
            )}
          </div>

          {group?.members?.length > 0 && (
            <div className="mt-4 grid sm:grid-cols-2 gap-2">
              {group.members.map((member) => (
                <div key={member.id} className="p-3 border border-slate-100 rounded-lg">
                  <p className="text-sm font-bold">{member.user?.name || member.user?.username || 'Member'}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{member.role}</p>
                </div>
              ))}
            </div>
          )}

          {invite && (
            <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
              <p className="text-xs font-black text-indigo-900">Invite token</p>
              <p className="mt-2 font-mono text-xs break-all">{invite.inviteToken}</p>
              <button onClick={() => navigator.clipboard?.writeText(invite.inviteToken)} className="mt-3 text-xs font-bold text-indigo-700 flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
