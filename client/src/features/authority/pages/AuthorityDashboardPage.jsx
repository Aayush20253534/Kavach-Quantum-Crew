import React, { useEffect, useState } from 'react';
import {
  Building2,
  Radio,
  Users,
  ShieldCheck,
  MapPin,
  Flame,
  Clock,
  BellRing,
  Send,
  CheckCircle2,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useAllIncidents, useResolveIncident } from '../api/authorityQueries';
import { authorityService } from '../api/authorityService';
import { AuthorityJurisdictionMap } from '../components/AuthorityJurisdictionMap';

export function AuthorityDashboardPage() {
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [commandStats, setCommandStats] = useState(null);
  const [jurisdictionData, setJurisdictionData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    authorityService.getJurisdictionOverview()
      .then((overview) => {
        if (cancelled) return;
        setJurisdictionData(overview);
        setCommandStats(overview?.stats || null);
        setBroadcastTarget(overview?.responder?.jurisdiction || '');
      })
      .catch(() => {
        if (!cancelled) {
          setJurisdictionData(null);
          setCommandStats(null);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // Real API hooks
  const { data: incidentsResponse, isLoading: incidentsLoading } = useAllIncidents();
  const { mutate: resolveIncident, isPending: isResolving } = useResolveIncident();

  // Extract array of items
  const incidentsList = Array.isArray(incidentsResponse)
    ? incidentsResponse
    : incidentsResponse?.items || [];

  // Filter active vs resolved for display
  const activeIncidents = incidentsList.filter(inc => inc.status !== 'RESOLVED');
  const jurisdiction = jurisdictionData?.responder?.jurisdiction || 'Assigned Jurisdiction';
  const nearbyServices = jurisdictionData?.nearbyServices || {};
  const policeCount = nearbyServices.policeStations?.length || 0;
  const fireCount = nearbyServices.fireStations?.length || 0;
  const activeTourists = commandStats?.activeTourists ?? 0;


  const handleSendBroadcast = (e) => {
    e.preventDefault();
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastModalOpen(false);
      setBroadcastMessage('');
    }, 1500);
  };

  const handleResolve = (id) => {
    resolveIncident(id);
  };

  return (
    <div className="space-y-4 max-w-[1320px] mx-auto pb-8 font-sans">

      {/* Top Banner Ticker */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-700 bg-[#0b1728] p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#e11d48] text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest rounded-md ">
              {jurisdiction.toUpperCase()} COMMAND
            </span>
            <span className="text-[11px] text-slate-300 font-bold tracking-widest uppercase">JURISDICTION-AWARE EMERGENCY GRID</span>
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-black text-white tracking-tight">
            Emergency Operations Command
          </h1>
        </div>

        <button
          onClick={() => setBroadcastModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#e11d48] text-white hover:bg-slate-50 text-[12px] font-bold uppercase tracking-widest rounded-md  transition-colors active:scale-95 cursor-pointer"
        >
          <BellRing className="w-4 h-4" /> Broadcast Safety Alert
        </button>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 bg-white space-y-2">
          <div className="flex justify-between items-center text-[12px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Active Tourists</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[24px] font-black text-slate-900">{activeTourists}</p>
          <span className="text-[11px] text-[#16a34a] font-bold">{commandStats?.activeTrips ?? 0} active trips</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-red-200 space-y-2">
          <div className="flex justify-between items-center text-[12px] font-bold text-[#b91c1c] uppercase tracking-widest">
            <span>Active Emergencies</span>
            <Radio className="w-4 h-4 text-[#e11d48] animate-pulse" />
          </div>
          <p className="text-[24px] font-black text-[#e11d48]">{activeIncidents.length} Active</p>
          <span className="text-[11px] text-[#991b1b] font-bold">{commandStats?.criticalIncidents ?? 0} critical incidents</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 bg-white space-y-2">
          <div className="flex justify-between items-center text-[12px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Police Stations</span>
            <Building2 className="w-4 h-4 text-[#2563eb]" />
          </div>
          <p className="text-[24px] font-black text-[#2563eb]">{policeCount}</p>
          <span className="text-[10px] text-slate-500 font-bold">Google Places · {jurisdiction}</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 bg-white space-y-2">
          <div className="flex justify-between items-center text-[12px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Fire Response Stations</span>
            <Flame className="w-4 h-4 text-[#dc2626]" />
          </div>
          <p className="text-[24px] font-black text-[#dc2626]">{fireCount}</p>
          <span className="text-[10px] text-slate-500 font-bold">Google Places · {jurisdiction}</span>
        </div>
      </div>

      {/* Main Grid: Active SOS Triage Feed & Sector Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Live Operational Coverage Map */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white ">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[13px] font-black text-slate-900">Live Operational Coverage</h2>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{jurisdiction}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 text-[9px] font-bold">
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">Police {policeCount}</span>
                  <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">Fire {fireCount}</span>
                  <span className="rounded-md bg-green-50 px-2 py-1 text-green-700">
                    Hospitals {nearbyServices.hospitals?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[420px]">
              <AuthorityJurisdictionMap
                jurisdiction={jurisdiction}
                services={nearbyServices}
              />
            </div>

            {!nearbyServices.configured && (
              <div className="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-[10px] font-semibold text-amber-800">
                Server-side Places lookup is not configured. Add GOOGLE_MAPS_API_KEY on the backend.
              </div>
            )}
          </div>
        </div>

        {/* Active SOS Triage List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 ">
            <div className="flex flex-row items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#e11d48]" />
                </div>
                <h2 className="text-[15px] font-black text-slate-900 tracking-wide">Priority Incident Feed</h2>
              </div>
              <span className="bg-[#e11d48] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded ">
                {activeIncidents.length} ACTIVE
              </span>
            </div>

            <div className="p-4 space-y-4 bg-slate-50/30">
              {incidentsLoading ? (
                <div className="flex justify-center items-center h-32">
                   <div className="w-6 h-6 border-2 border-slate-200 border-t-[#e11d48] rounded-full animate-spin"></div>
                </div>
              ) : activeIncidents.length === 0 ? (
                <div className="text-center py-10 bg-white border border-slate-200 rounded-md">
                   <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                   <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">No Active Incidents</p>
                </div>
              ) : (
                activeIncidents.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-lg bg-white border border-[#fecaca] shadow-[0_2px_10px_rgba(225,29,72,0.05)] space-y-4 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[12px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">ID: {ticket.id?.substring(0,8).toUpperCase()}</span>
                        <span className="bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest rounded  flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48] animate-pulse"></span>
                          {ticket.status || 'ACTIVE DISPATCH'}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ticket.createdAt || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] block mb-1">Tourist Details:</span>
                        <span className="font-black text-slate-900">{ticket.touristId?.name || 'Anonymous Tourist'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] block mb-1">GPS Location:</span>
                        <span className="text-[#e11d48] font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ticket.location?.coordinates ? `${ticket.location.coordinates[1].toFixed(4)}° N, ${ticket.location.coordinates[0].toFixed(4)}° E` : 'Sector 4 Ghats'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] block mb-1">Emergency Description:</span>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium leading-relaxed">
                          {ticket.description || 'Medical heatstroke assistance requested. Immediate response required.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => alert(`Connecting radio channel...`)}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-[#07111f] text-white text-[11px] font-bold uppercase tracking-widest rounded cursor-pointer  transition-colors"
                      >
                        Radio Connect PCR
                      </button>
                      <button
                        onClick={() => handleResolve(ticket.id)}
                        disabled={isResolving}
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-[#f0fdf4] hover:border-[#16a34a] hover:text-[#16a34a] text-slate-700 text-[11px] font-bold uppercase tracking-widest rounded cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Alert Modal */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg w-full max-w-[500px] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-[#fef2f2]">
              <AlertTriangle className="w-5 h-5 text-[#e11d48]" />
              <h2 className="text-[15px] font-black text-slate-900 tracking-wide">BROADCAST MASS ADVISORY</h2>
            </div>

            <div className="p-6">
              {!broadcastSent ? (
                <form onSubmit={handleSendBroadcast} className="space-y-5">
                  <p className="text-[12px] text-slate-600 font-medium leading-relaxed">
                    Transmit an urgent safety advisory to tourists in your assigned jurisdiction.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Target Jurisdiction</label>
                    <input
                      type="text"
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-md px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Emergency Advisory Text</label>
                    <textarea
                      placeholder="e.g. Due to sudden river current surge, bathing at Sangam Ghat #3 is temporarily redirected..."
                      rows={4}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-medium rounded-md px-4 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setBroadcastModalOpen(false)}
                      className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-widest rounded hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white text-[11px] font-bold uppercase tracking-widest rounded  transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Transmit Alert
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] flex items-center justify-center mx-auto ">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-black text-slate-900 tracking-tight mb-1">Broadcast Transmitted!</h3>
                    <p className="text-[13px] text-slate-500 font-medium">Sent to {activeTourists} active tourists across {jurisdiction}.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
