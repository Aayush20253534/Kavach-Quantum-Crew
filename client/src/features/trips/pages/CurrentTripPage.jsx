import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, Calendar, CheckCircle2, Clock3, Copy, Loader2, LogIn, MapPin, Navigation, Play, ShieldCheck, TimerReset, UserCheck, UserX, Users, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

import { groupService } from '../../groups/api/groupService';
import { credentialService } from '../../credentials/api/credentialService';
import { tripService } from '../api/tripService';
import { emergencyServicesApi } from '../../emergency-services/api/emergencyServicesApi';
import { createRealtimeSocket } from '../../../services/realtimeClient';

const dateText = (value) => value ? new Date(value).toLocaleString() : '—';
const MIN_GROUP_MEMBERS_TO_START = 2;

const getStartLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({});
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyM: position.coords.accuracy,
        capturedAt: new Date(position.timestamp || Date.now()).toISOString(),
      }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 15000 },
    );
  });


export function CurrentTripPage() {
  const { user } = useSelector((state) => state.auth);
  const [trip, setTrip] = useState(null);
  const [group, setGroup] = useState(null);
  const [individualCredential, setIndividualCredential] = useState(null);
  const [groupCredential, setGroupCredential] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [signalCases, setSignalCases] = useState([]);
  const [responseDispatches, setResponseDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [blockchainIntegrity, setBlockchainIntegrity] = useState(null);
  const [integritySocketConnected, setIntegritySocketConnected] = useState(false);
  const integrityTimerRef = useRef([]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const current = await tripService.getCurrentTrip();
      setTrip(current || null);
      if (current) {
        try { setIndividualCredential(await credentialService.getMyCredential(current.id)); } catch { setIndividualCredential(null); }
        try { const response = await emergencyServicesApi.getTouristDispatches(); setResponseDispatches(response?.data?.data || []); } catch { setResponseDispatches([]); }
      } else {
        setIndividualCredential(null);
        setResponseDispatches([]);
      }
      if (current?.tripType === 'GROUP') {
        try {
          const loadedGroup = await groupService.getGroupForTrip(current.id);
          setGroup(loadedGroup);
          try { setGroupCredential(await credentialService.getGroupCredential(loadedGroup.id)); } catch { setGroupCredential(null); }
          if (loadedGroup.leaderId === user?.id) {
            if (current.status === 'PLANNED') { try { setJoinRequests(await groupService.getPendingJoinRequests(loadedGroup.id)); } catch { setJoinRequests([]); } } else setJoinRequests([]);
            if (current.status === 'ACTIVE') { try { setSignalCases(await groupService.getSignalLossCases(current.id)); } catch { setSignalCases([]); } } else setSignalCases([]);
          } else {
            setJoinRequests([]);
            setSignalCases([]);
          }
        } catch { setGroup(null); setGroupCredential(null); setJoinRequests([]); }
      } else {
        setGroup(null);
        setGroupCredential(null);
        setJoinRequests([]);
        setSignalCases([]);
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

  useEffect(() => {
    if (!trip?.id || trip.status !== 'ACTIVE' || trip.tripType !== 'GROUP' || group?.leaderId !== user?.id) return undefined;
    let cancelled = false;

    const refreshSignalCases = async () => {
      try {
        const cases = await groupService.getSignalLossCases(trip.id);
        if (!cancelled) setSignalCases(cases || []);
      } catch {
        // Keep the previous cases on transient network failures.
      }
    };

    void refreshSignalCases();
    const timer = window.setInterval(refreshSignalCases, 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [trip?.id, trip?.status, trip?.tripType, group?.leaderId, user?.id]);

  useEffect(() => {
    if (!individualCredential?.id || !trip?.id) return undefined;

    setBlockchainIntegrity(null);
    const socket = createRealtimeSocket();

    const clearIntegrityTimers = () => {
      integrityTimerRef.current.forEach((timer) => window.clearTimeout(timer));
      integrityTimerRef.current = [];
    };
    const scheduleIntegrityState = (delay, value) => {
      const timer = window.setTimeout(() => setBlockchainIntegrity(value), delay);
      integrityTimerRef.current.push(timer);
    };

    const handleConnect = () => {
      setIntegritySocketConnected(true);
      setBlockchainIntegrity({ status: 'CHECKING', message: 'Checking the latest trusted blockchain snapshot.' });
    };
    const handleDisconnect = () => {
      setIntegritySocketConnected(false);
      clearIntegrityTimers();
    };
    const handleConnectError = (error) => {
      setIntegritySocketConnected(false);
      clearIntegrityTimers();
      console.error('Realtime integrity socket connection failed:', error?.message || error);
    };
    const handleIntegrity = ({ integrity } = {}) => {
      if (!integrity || integrity.credentialId !== individualCredential.id || integrity.tripId !== trip.id) return;

      if (integrity.status === 'INTEGRITY_UNAVAILABLE') {
        clearIntegrityTimers();
        setBlockchainIntegrity(integrity);
        return;
      }

      if (integrity.status === 'DB_TAMPERED') {
        clearIntegrityTimers();
        setBlockchainIntegrity(integrity);
        return;
      }

      if (integrity.status === 'FIXING') {
        setBlockchainIntegrity((current) => {
          if (current?.status === 'DB_TAMPERED') return current;
          return integrity;
        });
        return;
      }

      if (integrity.status === 'FIXED') {
        setBlockchainIntegrity((current) => current?.status === 'DB_TAMPERED' ? current : integrity);
        return;
      }

      if (integrity.status === 'VERIFIED') {
        clearIntegrityTimers();
        setBlockchainIntegrity((current) => {
          if (integrity.restored && ['DB_TAMPERED', 'FIXING', 'FIXED'].includes(current?.status)) {
            const base = { ...integrity, tamperedFields: integrity.tamperedFields || current?.tamperedFields };
            scheduleIntegrityState(1200, { ...base, status: 'FIXING' });
            scheduleIntegrityState(2400, { ...base, status: 'FIXED' });
            scheduleIntegrityState(4400, { ...base, status: 'VERIFIED', restored: false });
            window.setTimeout(() => {
              void tripService.getCurrentTrip().then((currentTrip) => setTrip(currentTrip || null)).catch(() => {});
            }, 2400);
            return { ...base, status: 'DB_TAMPERED' };
          }
          return { ...integrity, restored: false };
        });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('blockchain:integrity', handleIntegrity);
    socket.connect();

    return () => {
      clearIntegrityTimers();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('blockchain:integrity', handleIntegrity);
      socket.disconnect();
      setIntegritySocketConnected(false);
    };
  }, [individualCredential?.id, trip?.id]);

  useEffect(() => {
    if (!group?.id || group.leaderId !== user?.id || trip?.status !== 'PLANNED') return undefined;
    let cancelled = false;
    const refresh = async () => {
      try {
        const pending = await groupService.getPendingJoinRequests(group.id);
        if (!cancelled) setJoinRequests(pending);
      } catch {}
    };
    const timer = window.setInterval(refresh, 6000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [group?.id, group?.leaderId, trip?.status, user?.id]);

  const run = async (name, action) => {
    setBusy(name);
    setError('');
    try { await action(); await load(); }
    catch (e) { setError(e?.response?.data?.error?.message || e.message || 'Action failed'); }
    finally { setBusy(''); }
  };

  const respondToSignalCase = async (item, response) => {
    const actionName = response === 'FALSE_ALARM' ? `signal-false-${item.id}` : `signal-danger-${item.id}`;
    setBusy(actionName);
    setError('');
    try {
      await groupService.respondToSignalLoss(item.id, response);
      setSignalCases((current) => current.filter((candidate) => candidate.id !== item.id));
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Unable to record signal-loss response');
    } finally {
      setBusy('');
    }
  };

  const start = () => run('start', async () => {
    if (trip.tripType === 'GROUP' && (group?.members?.length || 0) < MIN_GROUP_MEMBERS_TO_START) {
      throw new Error('A group trip needs at least 2 members before it can be started.');
    }
    await tripService.grantConsent(trip.id, 'LOCATION_TRACKING');
    await tripService.grantConsent(trip.id, 'EMERGENCY_SHARING');
    const startLocation = await getStartLocation();
    await tripService.startTrip(trip.id, startLocation);
  });

  const extendBy = (minutes) =>
    run('extend', async () => {
      const currentEnd = new Date(trip.plannedEndAt).getTime();
      const plannedEndAt = new Date(currentEnd + minutes * 60_000).toISOString();
      await tripService.extendTrip(trip.id, plannedEndAt);
    });

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

      {signalCases.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-amber-950">Member signal-loss confirmation required</h2>
              <p className="mt-1 text-[11px] leading-5 text-amber-800">KAVACH detected a group member offline for at least 5 minutes. Confirm danger or mark false alarm. No response within the 5-minute window escalates the case to Disaster Management.</p>
              <div className="mt-3 space-y-2">
                {signalCases.map((item) => (
                  <div key={item.id} className="rounded-xl border border-amber-200 bg-white p-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <p className="text-xs font-black text-slate-900">Signal-loss case · {item.status.replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-[10px] text-slate-500">Detected {dateText(item.detectedAt)} · response deadline {dateText(item.responseDeadlineAt)}</p>
                    </div>
                    <div className="mt-3 flex gap-2 sm:mt-0">
                      <button disabled={Boolean(busy)} onClick={() => respondToSignalCase(item, 'FALSE_ALARM')} className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-black text-slate-700 disabled:opacity-50">{busy === `signal-false-${item.id}` ? 'Saving…' : 'False alarm'}</button>
                      <button disabled={Boolean(busy)} onClick={() => respondToSignalCase(item, 'CONFIRMED_DANGER')} className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white disabled:opacity-50">{busy === `signal-danger-${item.id}` ? 'Saving…' : 'Confirm danger'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {responseDispatches.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5 shadow-sm">
          <h2 className="text-sm font-black text-blue-950 flex items-center gap-2"><Navigation className="h-4 w-4" /> Emergency response live tracking</h2>
          <p className="mt-1 text-[11px] text-blue-700">Police, ambulance/hospital and fire dispatches assigned to your incident or group can be checked live from here.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {responseDispatches.map((dispatch) => (
              <Link key={dispatch.id} to={`/tourist/response/${dispatch.id}`} className="rounded-xl border border-blue-200 bg-white p-3 hover:border-blue-400">
                <p className="text-xs font-black text-slate-900">{dispatch.requestedUnitType} · {dispatch.status}</p>
                <p className="mt-1 text-[10px] text-slate-500">{dispatch.incident?.title || 'Emergency response'} · Open live tracking</p>
              </Link>
            ))}
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
          <CredentialCard
            title="Individual ID"
            credential={individualCredential}
            integrity={blockchainIntegrity}
            integritySocketConnected={integritySocketConnected}
          />
          <Link to="/tourist/checkins" className="p-3.5 sm:p-4 bg-slate-50 rounded-xl">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Safety Check-ins</p>
            <p className="mt-1 font-bold text-sm">Open check-in schedule →</p>
          </Link>
        </div>

        {individualCredential?.verificationUrl && (
          <CredentialQrPanel
            title="Scan Individual ID to verify"
            description="This QR verifies your trip-scoped individual credential. It remains valid only while the credential and trip are active."
            value={individualCredential.verificationUrl}
            copyValue={individualCredential.publicId}
            copyLabel="Copy individual ID"
          />
        )}
      </div>

      {trip.tripType === 'GROUP' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-black">Trip Group</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1">{groupMemberCount} active member(s)</p>
            </div>
            {groupCredential?.groupJoinQrPayload && (
              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                QR ready to scan
              </span>
            )}
          </div>

          {groupCredential && (
            <div className="mt-4">
              <CredentialCard
                title="Group ID"
                credential={groupCredential}
                integritySocketConnected={integritySocketConnected}
              />
            </div>
          )}

          {isOwner && trip.status === 'PLANNED' && joinRequests.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-amber-950">Pending join requests</p>
                  <p className="mt-1 text-[11px] text-amber-700">Scanning proves the group QR is valid. Membership is created only after you approve the tourist.</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-amber-800 ring-1 ring-amber-200">{joinRequests.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {joinRequests.map((request) => (
                  <div key={request.id} className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{request.user?.name || request.user?.username || 'Tourist'}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">Requested {dateText(request.requestedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => run(`reject-${request.id}`, () => groupService.rejectJoinRequest(group.id, request.id))}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[10px] font-black text-red-600 disabled:opacity-50"
                      >
                        {busy === `reject-${request.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />} Reject
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => run(`approve-${request.id}`, () => groupService.approveJoinRequest(group.id, request.id))}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white disabled:opacity-50"
                      >
                        {busy === `approve-${request.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />} Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

          {groupCredential?.groupJoinQrPayload && (
            <CredentialQrPanel
              title="Scan Group ID to join"
              description="This secure QR lets another tourist request to join your group. The underlying blockchain identifier is never displayed to users."
              value={groupCredential.groupJoinQrPayload}
              copyValue={groupCredential.groupJoinUrl || groupCredential.groupJoinQrPayload}
              copyLabel="Copy join link"
            />
          )}
        </div>
      )}
    </div>
  );
}


function CredentialQrPanel({ title, description, value, copyValue, copyLabel, rawValue }) {
  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 sm:p-5">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <QRCodeSVG
            value={value}
            size={260}
            level="L"
            marginSize={4}
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-sm font-black text-indigo-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-indigo-700">{description}</p>
          {rawValue && (
            <p className="mt-3 rounded-lg border border-indigo-100 bg-white/70 px-3 py-2 font-mono text-[10px] break-all text-indigo-950">{rawValue}</p>
          )}
          <button onClick={() => navigator.clipboard?.writeText(copyValue)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-700">
            <Copy className="w-3.5 h-3.5" /> {copyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CredentialCard({
  title,
  credential,
  integrity = null,
  integritySocketConnected = false,
}) {
  if (!credential) {
    return (
      <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
        Loading {title.toLowerCase()}…
      </div>
    );
  }

  const blockchainStatus = credential.blockchainStatus;

  const integrityStatus = integrity?.status || null;
  const tampered = integrityStatus === 'DB_TAMPERED';
  const fixing = integrityStatus === 'FIXING';
  const fixed = integrityStatus === 'FIXED';
  const unavailable = integrityStatus === 'INTEGRITY_UNAVAILABLE';
  const checking = integrityStatus === 'CHECKING';
  const approved = blockchainStatus === 'CONFIRMED' && integrityStatus === 'VERIFIED';

  const statusClass = tampered
    ? 'text-red-600'
    : fixing || checking
      ? 'text-amber-600'
      : unavailable
        ? 'text-red-600'
        : blockchainStatus === 'CONFIRMED'
          ? 'text-emerald-600'
          : blockchainStatus === 'DISABLED'
            ? 'text-slate-500'
            : 'text-amber-600';

  const statusText = tampered
    ? 'Blockchain verified · TAMPERED'
    : fixing
      ? 'Blockchain verified · FIXING'
      : fixed
        ? 'Blockchain verified · FIXED'
        : approved
          ? 'Blockchain verified · APPROVED'
          : unavailable
            ? 'Blockchain verified · INTEGRITY UNAVAILABLE'
            : checking
              ? 'Blockchain verified · CHECKING'
              : blockchainStatus === 'CONFIRMED'
                ? 'Blockchain verified · CHECKING'
                : `Blockchain: ${blockchainStatus}`;

  return (
    <div
      className={`rounded-xl border p-3.5 sm:p-4 ${
        tampered || unavailable
          ? 'border-red-200 bg-red-50'
          : fixing || checking
            ? 'border-amber-200 bg-amber-50'
            : fixed
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">
            {title}
          </p>

          <p className="mt-1 break-all font-mono text-xs font-bold text-slate-800">
            {credential.publicId}
          </p>
        </div>

        {blockchainStatus === 'CONFIRMED' && (
          <span
            className={`mt-0.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide ${
              integritySocketConnected
                ? 'text-emerald-600'
                : 'text-red-600'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                integritySocketConnected
                  ? 'bg-emerald-500'
                  : 'bg-red-500'
              }`}
            />

            {integritySocketConnected
              ? 'Connected'
              : 'Connecting'}
          </span>
        )}
      </div>

      <p
        className={`mt-2 text-[10px] font-bold ${statusClass}`}
      >
        {statusText}
      </p>

      {tampered && (
        <p className="mt-1 text-[10px] leading-4 text-red-600">
          Changed fields: {integrity.tamperedFields?.join(', ') || 'protected trip data'}. Database values differ from the trusted blockchain snapshot.
        </p>
      )}

      {fixing && (
        <p className="mt-1 text-[10px] leading-4 text-amber-700">
          Restoring the trusted blockchain values into PostgreSQL.
        </p>
      )}

      {fixed && (
        <p className="mt-1 text-[10px] leading-4 text-emerald-700">
          Tampered database values were restored successfully. Re-validating integrity now.
        </p>
      )}

      {unavailable && (
        <p className="mt-1 text-[10px] leading-4 text-red-600">
          {integrity.message || 'The trusted blockchain snapshot cannot currently be read, so integrity cannot be approved.'}
        </p>
      )}

      {credential.blockchainError?.message && (
        <p className="mt-1 text-[10px] leading-4 text-red-600">
          {credential.blockchainError.message}
          {credential.blockchainError.code
            ? ` (${credential.blockchainError.code})`
            : ''}
        </p>
      )}

      <p className="mt-1 text-[10px] text-slate-500">
        Expires {new Date(credential.expiresAt).toLocaleString()}
      </p>
    </div>
  );
}
