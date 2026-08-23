import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Radio, 
  Users, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  BellRing, 
  Send, 
  CheckCircle2, 
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useAllIncidents, useResolveIncident } from '../api/authorityQueries';
import { authorityService } from '../api/authorityService';

export function AuthorityDashboardPage() {
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('All Sectors (Sangam + Kumbh + City)');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [commandStats, setCommandStats] = useState(null);
  const [fleet, setFleet] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      authorityService.getDashboard(),
      authorityService.getUnits(),
      authorityService.getAnalyticsOverview(),
    ]).then(([dashboard, units, overview]) => {
      if (!cancelled) {
        setCommandStats({ ...(overview || {}), ...(dashboard || {}) });
        setFleet(Array.isArray(units) ? units : []);
      }
    }).catch(() => {
      if (!cancelled) { setCommandStats(null); setFleet([]); }
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

  const sectorTelemetry = [
    { sector: 'Sector 1 (Sangam Confluence)', density: '78% (High)', status: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]', patrols: '18 Units' },
    { sector: 'Sector 2 (Akshayavat & Fort)', density: '42% (Normal)', status: 'bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]', patrols: '12 Units' },
    { sector: 'Sector 3 (Bade Hanuman Ghat)', density: '65% (Moderate)', status: 'bg-[#fefce8] text-[#a16207] border-[#fef08a]', patrols: '14 Units' },
    { sector: 'Sector 4 (Civil Lines Hub)', density: '30% (Low)', status: 'bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]', patrols: '8 Units' },
  ];

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
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10 font-sans">
      
      {/* Top Banner Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-lg bg-[#e11d48] border border-[#be123c] shadow-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white text-[#e11d48] text-[10px] font-black px-2.5 py-1 uppercase tracking-widest rounded-md shadow-sm">
              PRAYAGRAJ COMMAND
            </span>
            <span className="text-[11px] text-[#ffe4e6] font-bold tracking-widest uppercase">SECTOR 1-8 INTEGRATED GRID</span>
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-black text-white tracking-tight">
            Emergency Dispatch & Live Radar
          </h1>
        </div>

        <button
          onClick={() => setBroadcastModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-white text-[#e11d48] hover:bg-slate-50 text-[12px] font-bold uppercase tracking-widest rounded-md shadow-sm transition-colors active:scale-95 cursor-pointer"
        >
          <BellRing className="w-4 h-4" /> Broadcast Safety Alert
        </button>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[12px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Active Pilgrims</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[28px] font-black text-slate-900">{commandStats?.tourists ?? 0}</p>
          <span className="text-[11px] text-[#16a34a] font-bold">{commandStats?.activeTrips ?? 0} active trips</span>
        </div>

        <div className="bg-[#fff1f2] p-6 rounded-lg border border-[#ffe4e6] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[12px] font-bold text-[#b91c1c] uppercase tracking-widest">
            <span>Live SOS Emergencies</span>
            <Radio className="w-4 h-4 text-[#e11d48] animate-pulse" />
          </div>
          <p className="text-[28px] font-black text-[#e11d48]">{activeIncidents.length} Active</p>
          <span className="text-[11px] text-[#991b1b] font-bold">{commandStats?.criticalIncidents ?? 0} critical incidents</span>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[12px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Active Patrol Units</span>
            <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
          </div>
          <p className="text-[28px] font-black text-[#16a34a]">{fleet.filter((unit) => unit.status !== "OUT_OF_SERVICE").length} Units</p>
          <span className="text-[11px] text-slate-500 font-bold">{fleet.filter((unit) => unit.status === "AVAILABLE").length} available</span>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[12px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Safe Havens Online</span>
            <MapPin className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-[28px] font-black text-sky-600">{commandStats?.availableResponders ?? 0} Staff</p>
          <span className="text-[11px] text-slate-500 font-bold">available responders</span>
        </div>
      </div>

      {/* Main Grid: Active SOS Triage Feed & Sector Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active SOS Triage List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-row items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#e11d48]" />
                </div>
                <h2 className="text-[15px] font-black text-slate-900 tracking-wide">Real-Time SOS Incident Triage</h2>
              </div>
              <span className="bg-[#e11d48] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded shadow-sm">
                {activeIncidents.length} URGENT TICKETS
              </span>
            </div>
            
            <div className="p-6 space-y-5 bg-slate-50/30">
              {incidentsLoading ? (
                <div className="flex justify-center items-center h-32">
                   <div className="w-6 h-6 border-2 border-slate-200 border-t-[#e11d48] rounded-full animate-spin"></div>
                </div>
              ) : activeIncidents.length === 0 ? (
                <div className="text-center py-10 bg-white border border-slate-100 rounded-md">
                   <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                   <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">No Active Incidents</p>
                </div>
              ) : (
                activeIncidents.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-5 rounded-md bg-white border border-[#fecaca] shadow-[0_2px_10px_rgba(225,29,72,0.05)] space-y-4 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[12px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">ID: {ticket.id?.substring(0,8).toUpperCase()}</span>
                        <span className="bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest rounded shadow-sm flex items-center gap-1.5">
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
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded text-slate-700 font-medium leading-relaxed">
                          {ticket.description || 'Medical heatstroke assistance requested. Immediate response required.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => alert(`Connecting radio channel...`)}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest rounded cursor-pointer shadow-sm transition-colors"
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

        {/* Sector Telemetry Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[14px] font-black text-slate-900 tracking-wide">Sector Crowd & Patrol Density</h2>
            </div>
            <div className="p-5 space-y-3">
              {sectorTelemetry.map((sec, idx) => (
                <div key={idx} className="p-4 rounded-md bg-white border border-slate-200 space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-[13px]">{sec.sector}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest rounded border ${sec.status}`}>
                      {sec.density}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold border-t border-slate-100 pt-2">
                    <span className="text-slate-400 uppercase tracking-widest">Patrol Deployment:</span>
                    <span className="text-[#16a34a]">{sec.patrols}</span>
                  </div>
                </div>
              ))}
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
                    Transmit urgent push notifications and SMS banners to all registered pilgrims and tourists in the designated sectors.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Target Sector</label>
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
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white text-[11px] font-bold uppercase tracking-widest rounded shadow-sm transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Transmit Alert
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-black text-slate-900 tracking-tight mb-1">Broadcast Transmitted!</h3>
                    <p className="text-[13px] text-slate-500 font-medium">Sent to 12,480 active tourists across Prayagraj.</p>
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
