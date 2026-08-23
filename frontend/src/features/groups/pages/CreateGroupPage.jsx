import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BatteryMedium, Check, Copy, Loader2, QrCode, Radio, ShieldCheck, Users } from 'lucide-react';
import { groupService } from '../api/groupService';
import { useGroupForTrip } from '../api/groupQueries';
import { useCurrentTrip } from '../../trips/api/tripQueries';

const unwrap = (value) => value?.data ?? value;

export function CreateGroupPage() {
  const routeLocation = useLocation();
  const { data: currentTripResponse } = useCurrentTrip();
  const currentTrip = unwrap(currentTripResponse);
  const tripId = routeLocation.state?.tripId || currentTrip?.id;
  const destination = routeLocation.state?.destination || currentTrip?.locationName || 'Current trip';
  const { data: groupResponse, isLoading } = useGroupForTrip(tripId);
  const group = unwrap(groupResponse);

  const [copied, setCopied] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [inviteError, setInviteError] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);

  const members = useMemo(() => (group?.members ?? []).map((member) => ({
    id: member.id,
    name: member.user?.name || 'Group member',
    role: member.role === 'LEADER' ? 'Group Leader' : 'Member',
  })), [group]);

  useEffect(() => {
    setInvitation(null);
    setInviteError('');
  }, [group?.id]);

  const createInvitation = async () => {
    if (!group?.id) return;
    setCreatingInvite(true);
    setInviteError('');
    try {
      const result = unwrap(await groupService.createInvitation(group.id));
      setInvitation(result);
    } catch (error) {
      setInviteError(error.response?.data?.error?.message || 'Unable to create invitation. Only the group leader can create one.');
    } finally {
      setCreatingInvite(false);
    }
  };

  const inviteValue = invitation?.inviteToken || invitation?.inviteCode || '';
  const handleCopy = async () => {
    if (!inviteValue) return;
    await navigator.clipboard.writeText(inviteValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-10 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Family & Group Safety Circle</h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">Group trip for <strong>{destination}</strong>. Share an invitation with your companions.</p>
        </div>
        <Link to="/tourist/groups/join">
          <button className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-6 py-3 rounded-md font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm">
            <QrCode className="w-4 h-4" /> Join a Group
          </button>
        </Link>
      </div>

      {isLoading && <div className="p-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>}

      {!isLoading && group && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-lg">
                <h2 className="text-[14px] font-black text-slate-900 tracking-wide">Group Invitation</h2>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-md">ACTIVE</span>
              </div>
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mb-5"><ShieldCheck className="w-12 h-12" /></div>
                <p className="text-[12px] text-slate-500 max-w-sm mb-6">Create a short-lived invitation token. Your teammate can paste it on the Join Group screen.</p>
                {!invitation ? (
                  <button onClick={createInvitation} disabled={creatingInvite} className="px-5 py-3 rounded-md bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest disabled:opacity-60 flex items-center gap-2">
                    {creatingInvite && <Loader2 className="w-4 h-4 animate-spin" />} Generate Invite
                  </button>
                ) : (
                  <div className="w-full max-w-md flex items-stretch border border-slate-200 rounded-md overflow-hidden shadow-sm">
                    <div className="flex-1 bg-slate-50 px-4 py-3 text-left min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Invite Code</span>
                      <span className="font-mono font-black text-slate-900 text-[12px] break-all">{invitation.inviteCode}</span>
                    </div>
                    <button onClick={handleCopy} className="bg-white hover:bg-slate-50 text-slate-700 px-4 border-l border-slate-200" title="Copy invitation token">
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                {inviteError && <p className="text-[11px] text-red-600 mt-4">{inviteError}</p>}
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm h-full">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-lg">
                <h2 className="text-[14px] font-black text-slate-900 tracking-wide flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> Circle ({members.length})</h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{group.status}</span>
              </div>
              <div className="p-5 space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="p-3 border border-slate-200 rounded-md bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-[12px]">{member.name.charAt(0)}</div>
                      <div><p className="text-[13px] font-bold text-slate-900">{member.name}</p><p className="text-[11px] text-slate-500">{member.role}</p></div>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1"><BatteryMedium className="w-3.5 h-3.5" /> Active</span>
                  </div>
                ))}
              </div>
              <div className="p-4 m-5 mt-0 rounded-md bg-red-50 border border-red-100">
                <span className="font-bold text-red-700 text-[12px] flex items-center gap-1.5 mb-1"><Radio className="w-3.5 h-3.5" /> Group Safety</span>
                <p className="text-red-700/80 font-medium text-[11px] leading-relaxed">Live member telemetry is used only while the trip is active and location sharing is enabled.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !group && <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-[12px] font-semibold text-amber-800">No group is attached to this trip yet. Choose a destination from the dashboard search to create one.</div>}
    </div>
  );
}
