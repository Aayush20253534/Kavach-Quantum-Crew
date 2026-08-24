import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, CheckCircle2, Clock3, Copy, Loader2, LogIn, MapPin, Play, ShieldCheck, TimerReset, Users, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { groupService } from '../../groups/api/groupService';
import { credentialService } from '../../credentials/api/credentialService';
import { tripService } from '../api/tripService';

const dateText = (value) => value ? new Date(value).toLocaleString() : '—';
const MIN_GROUP_MEMBERS_TO_START = 2;

export function CurrentTripPage() {
  const { user } = useSelector((state) => state.auth);
  const [trip, setTrip] = useState(null);
  const [group, setGroup] = useState(null);
  const [invite, setInvite] = useState(null);
  const [individualCredential, setIndividualCredential] = useState(null);
  const [groupCredential, setGroupCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const current = await tripService.getCurrentTrip();
      setTrip(current || null);
      if (current) {
        try { setIndividualCredential(await credentialService.getMyCredential(current.id)); } catch { setIndividualCredential(null); }
      } else {
        setIndividualCredential(null);
      }
      if (current?.tripType === 'GROUP') {
        try {
          const loadedGroup = await groupService.getGroupForTrip(current.id);
          setGroup(loadedGroup);
          try { setGroupCredential(await credentialService.getGroupCredential(loadedGroup.id)); } catch { setGroupCredential(null); }
        } catch { setGroup(null); setGroupCredential(null); }
      } else {
        setGroup(null);
        setGroupCredential(null);
      }
    } catch (e) {
      if (e?.response?.status === 404) setTrip(null);
      else setError(e?.response?.data?.error?.message || 'Unable to load current trip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const run = async (name, action) => {
    setBusy(name);
    setError('');
    try { await action(); await load(); }
    catch (e) { setError(e?.response?.data?.error?.message || e.message || 'Action failed'); }
    finally { setBusy(''); }
  };

  const start = () => run('start', async () => {
    if (trip.tripType === 'GROUP' && (group?.members?.length || 0) < MIN_GROUP_MEMBERS_TO_START) {
      throw new Error('A group trip needs at least 2 members before it can be started.');
    }
    await tripService.grantConsent(trip.id, 'LOCATION_TRACKING');
    await tripService.grantConsent(trip.id, 'EMERGENCY_SHARING');
    await tripService.startTrip(trip.id);
  });

  const extendBy = (minutes) =>
    run('extend', async () => {
      const currentEnd = new Date(trip.plannedEndAt).getTime();
      const plannedEndAt = new Date(currentEnd + minutes * 60_000).toISOString();
      await tripService.extendTrip(trip.id, plannedEndAt);
    });

  const createInvite = async () => {
    setBusy('invite');
    try { setInvite(await groupService.createInvitation(group.id, 60)); }
    catch (e) { setError(e?.response?.data?.error?.message || 'Could not create invitation'); }
    finally { setBusy(''); }
  };

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const isOwner = trip?.touristId === user?.id;
  const groupMemberCount = group?.members?.length || 0;
  const groupTooSmallToStart = trip?.tripType === 'GROUP' && groupMemberCount < MIN_GROUP_MEMBERS_TO_START;
  const remainingMs =
    trip?.status === 'ACTIVE'
      ? new Date(trip.plannedEndAt).getTime() - now
      : null;
  const endingSoon =
    remainingMs != null && remainingMs > 0 && remainingMs <= 30 * 60_000;
  const remainingMinutes =
    remainingMs == null ? null : Math.max(0, Math.ceil(remainingMs / 60_000));

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center bg-white border border-slate-200 rounded-2xl">
        <MapPin className="w-10 h-10 mx-auto text-slate-300" />
        <h2 className="mt-4 text-xl font-black">No current trip</h2>
        <p className="text-sm text-slate-500 mt-2">Plan a trip to enable tracking, groups, check-ins and SOS.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link to="/tourist/trips/create" className="inline-flex items-center px-5 py-2.5 bg-rose-600 text-white rounded-lg text-[11px] sm:text-xs font-black uppercase">Plan Trip</Link>
          <Link to="/tourist/groups/join" className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-[11px] sm:text-xs font-black uppercase">
            <LogIn className="w-4 h-4" /> Join Group
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8 sm:pb-10 space-y-4 sm:space-y-6">
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {endingSoon && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-black text-amber-950">
                  Your trip ends in about {remainingMinutes} minute{remainingMinutes === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-amber-800 sm:text-[11px]">
                  We also send an email reminder roughly 30 minutes before the scheduled end.
                  Extend the trip now if you are still travelling.
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="flex flex-wrap gap-2">
                {[30, 60, 120].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => extendBy(minutes)}
                    disabled={Boolean(busy)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 text-[10px] font-black text-amber-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === 'extend' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <TimerReset className="h-3.5 w-3.5" />
                    )}
                    +{minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-rose-600">{trip.status}</span>
            <h1 className="text-xl sm:text-2xl font-black mt-1">{trip.locationName}</h1>
            <div className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm text-slate-600">
              <p><Calendar className="w-4 h-4 inline mr-2" />{dateText(trip.plannedStartAt)} → {dateText(trip.plannedEndAt)}</p>
              <p><Users className="w-4 h-4 inline mr-2" />{trip.tripType}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner && trip.status === 'PLANNED' && (
              <>
                <button
                  onClick={start}
                  disabled={Boolean(busy) || groupTooSmallToStart}
                  title={groupTooSmallToStart ? 'Add at least one more member before starting this group trip.' : undefined}
                  className="inline-flex min-w-[116px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[11px] font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:text-xs"
                >
                  {busy === 'start' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {busy === 'start' ? 'Starting…' : 'Start Trip'}
                </button>
                <button onClick={() => run('cancel', () => tripService.cancelTrip(trip.id))} disabled={busy} className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-red-200 text-red-600 text-[11px] sm:text-xs font-black">
                  Cancel
                </button>
              </>
            )}
            {isOwner && trip.status === 'ACTIVE' && (
              <button
                onClick={() => run('complete', () => tripService.completeTrip(trip.id))}
                disabled={Boolean(busy)}
                className="inline-flex min-w-[118px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[11px] font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:text-xs"
              >
                {busy === 'complete' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {busy === 'complete' ? 'Completing…' : 'Complete Trip'}
              </button>
            )}
          </div>
        </div>

        {groupTooSmallToStart && trip.status === 'PLANNED' && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] sm:text-xs font-semibold text-amber-800">
            Add at least one more group member before starting. Group trips require a minimum of 2 members.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mt-5 sm:mt-7">
          <CredentialCard title="Individual ID" credential={individualCredential} />
          <Link to="/tourist/checkins" className="p-3.5 sm:p-4 bg-slate-50 rounded-xl">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Safety Check-ins</p>
            <p className="mt-1 font-bold text-sm">Open check-in schedule →</p>
          </Link>
        </div>
      </div>

      {trip.tripType === 'GROUP' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-black">Trip Group</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1">{groupMemberCount} active member(s)</p>
            </div>
            {group && (
              <button onClick={createInvite} disabled={busy === 'invite'} className="px-3.5 sm:px-4 py-2 rounded-lg bg-slate-900 text-white text-[11px] sm:text-xs font-bold">
                Create Invite
              </button>
            )}
          </div>

          {groupCredential && (
            <div className="mt-4">
              <CredentialCard title="Group ID" credential={groupCredential} compact />
            </div>
          )}

          {group?.members?.length > 0 && (
            <div className="mt-4 grid sm:grid-cols-2 gap-2">
              {group.members.map((member) => (
                <div key={member.id} className="p-2.5 sm:p-3 border border-slate-100 rounded-lg">
                  <p className="text-xs sm:text-sm font-bold">{member.user?.name || member.user?.username || 'Member'}</p>
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


function CredentialCard({ title, credential, compact = false }) {
  if (!credential) return <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl text-xs text-slate-500">Loading {title.toLowerCase()}…</div>;
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 ${compact ? 'p-4' : 'p-3.5 sm:p-4'}`}>
      <div className="flex items-start gap-4">
        {credential.qrDataUrl && <img src={credential.qrDataUrl} alt={`${title} QR code`} className="h-24 w-24 rounded-lg border border-white bg-white p-1 shadow-sm" />}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">{title}</p>
          <p className="mt-1 break-all font-mono text-xs font-bold text-slate-800">{credential.publicId}</p>
          <p className={`mt-2 text-[10px] font-bold ${credential.blockchainStatus === 'CONFIRMED' ? 'text-emerald-600' : 'text-amber-600'}`}>Blockchain: {credential.blockchainStatus}</p>
          <p className="mt-1 text-[10px] text-slate-500">Expires {new Date(credential.expiresAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
