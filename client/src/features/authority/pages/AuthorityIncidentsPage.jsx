import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, ShieldAlert, Radio, Search, 
  Filter, MapPin, Clock, ArrowRight, Loader2, ServerCrash,
  CheckCircle2, ShieldCheck, Crosshair, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { authorityService } from '../api/authorityService';
import { createRealtimeSocket } from '../../../services/realtimeClient';
import { AuthorityOperationsMap } from '../components/AuthorityOperationsMap';

export function AuthorityIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState('LIST');
  const [units, setUnits] = useState([]);
  const [responseMetrics, setResponseMetrics] = useState({
    averageMinutes: null,
    respondedCount: 0,
  });
  const [unitMetrics, setUnitMetrics] = useState({
    deployed: 0,
    active: 0,
    total: 0,
  });

  useEffect(() => {
    setMounted(true);
    void fetchIncidents();

    const socket = createRealtimeSocket();
    const refresh = () => { void fetchIncidents({ background: true }); };

    socket.on('incident:created', refresh);
    socket.on('incident:updated', refresh);
    socket.on('dispatch:updated', refresh);
    socket.connect();

    // Socket delivery is the primary path. Polling is a fallback for proxies or
    // deployments where WebSockets are temporarily unavailable.
    const timer = window.setInterval(refresh, 10_000);

    return () => {
      window.clearInterval(timer);
      socket.off('incident:created', refresh);
      socket.off('incident:updated', refresh);
      socket.off('dispatch:updated', refresh);
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchIncidents = async ({ background = false } = {}) => {
    try {
      if (!background) setLoading(true);
      setError('');

      const to = new Date();
      const from = new Date(to);
      from.setUTCDate(from.getUTCDate() - 29);

      const [response, responseTimes, units] = await Promise.all([
        authorityService.getIncidentQueue(),
        authorityService.getResponseTimeAnalytics({
          from: from.toISOString(),
          to: to.toISOString(),
        }),
        authorityService.getUnits(),
      ]);

      const data = response || [];
      const unitList = Array.isArray(units) ? units : [];
      const deployedUnits = unitList.filter(
        (unit) => String(unit.status || '').toUpperCase() === 'DISPATCHED',
      ).length;
      const activeUnits = unitList.filter(
        (unit) => String(unit.status || '').toUpperCase() !== 'OUT_OF_SERVICE',
      ).length;

      setIncidents(Array.isArray(data) ? data : []);
      setUnits(unitList);
      setResponseMetrics({
        averageMinutes: responseTimes?.incidents?.responseStartMinutes ?? null,
        respondedCount: responseTimes?.incidents?.respondedCount ?? 0,
      });
      setUnitMetrics({
        deployed: deployedUnits,
        active: activeUnits,
        total: unitList.length,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load incidents');
    } finally {
      if (!background) setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredIncidents = incidents.filter((incident) => {
    const status = (incident.status || 'OPEN').toUpperCase();
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNASSIGNED') return !incident.expired && !incident.assignedToId && !incident.fleetAssigned && ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(status);
    if (activeTab === 'ACTIVE') return !incident.expired && ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(status);
    if (activeTab === 'RESOLVED') return ['RESOLVED', 'DISMISSED'].includes(status);
    if (activeTab === 'EXPIRED') return incident.expired && !['RESOLVED', 'DISMISSED'].includes(status);
    return true;
  });

  // Calculate against the actual backend IncidentStatus enum.
  const activeCount = incidents.filter((incident) =>
    !incident.expired &&
    ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes((incident.status || 'OPEN').toUpperCase()),
  ).length;

  const unassignedCount = incidents.filter((incident) =>
    !incident.expired &&
    !incident.assignedToId &&
    !incident.fleetAssigned &&
    ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes((incident.status || 'OPEN').toUpperCase()),
  ).length;

  return (
    <div className={`space-y-6 font-sans max-w-[1200px] mx-auto pb-10 transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Command Center</span>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
          </div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Incident Dispatch Queue
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Live feed of SOS emergencies and verified hazards requiring immediate response.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            Refresh
          </button>
          <button
            onClick={() => setViewMode((current) => current === 'MAP' ? 'LIST' : 'MAP')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg shadow-sm hover:bg-slate-800 transition-all active:scale-95 cursor-pointer font-bold text-[11px] uppercase tracking-wider"
          >
            <Crosshair className="w-4 h-4" /> {viewMode === 'MAP' ? 'List View' : 'Map View'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Incidents</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900">{activeCount}</span>
            {activeCount > 0 && <span className="text-[10px] font-bold text-red-500 mb-1 flex items-center"><ArrowUpRight className="w-3 h-3" /> Live</span>}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
          </div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest relative z-10">Unassigned</span>
          <div className="flex items-end justify-between relative z-10">
            <span className="text-3xl font-black text-slate-900">{unassignedCount}</span>
            <span className="text-[10px] font-bold text-amber-600 mb-1">Needs Dispatch</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Response Time</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900">
              {responseMetrics.averageMinutes == null ? '—' : responseMetrics.averageMinutes}
              {responseMetrics.averageMinutes != null && <span className="text-lg">m</span>}
            </span>
            <span className={`text-[10px] font-bold mb-1 ${
              responseMetrics.averageMinutes != null && responseMetrics.averageMinutes < 5
                ? 'text-emerald-500'
                : 'text-slate-400'
            }`}>
              {responseMetrics.respondedCount > 0
                ? `${responseMetrics.respondedCount} responded · target < 5m`
                : 'No response data yet'}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units Deployed</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900">{unitMetrics.deployed}</span>
            <span className="text-[10px] font-bold text-slate-400 mb-1">
              of {unitMetrics.active} active · {unitMetrics.total} total
            </span>
          </div>
        </div>
      </div>

      {viewMode === 'MAP' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[13px] font-black uppercase tracking-wide text-slate-900">Operational Map</h2>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Live incidents and registered Police, Ambulance/Hospital and Fire fleet coordinates.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">Incidents {filteredIncidents.length}</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">Fleets {units.length}</span>
            </div>
          </div>
          <div className="h-[560px]">
            <AuthorityOperationsMap incidents={filteredIncidents} units={units} />
          </div>
        </div>
      )}

      {/* Main Queue Interface */}
      <div className={`${viewMode === 'MAP' ? 'hidden' : ''} bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden`}>
        
        {/* Filters / Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            {['ALL', 'UNASSIGNED', 'ACTIVE', 'EXPIRED', 'RESOLVED'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ID, location..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[12px] font-medium text-slate-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
              />
            </div>
            <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shrink-0">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {error && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-red-800 font-bold text-sm mb-1">Failed to connect to Command Backend</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}

        {!error && loading && incidents.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
            <p className="text-sm font-semibold text-slate-500">Syncing with dispatch...</p>
          </div>
        ) : !error && (
          <div className="divide-y divide-slate-100">
            {!loading && filteredIncidents.length === 0 && (
               <div className="p-12 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                   <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                 </div>
                 <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Queue Empty</h3>
                 <p className="text-[12px] text-slate-500 font-medium mt-1">No incidents matching the current filter.</p>
               </div>
            )}

            {filteredIncidents.map((incident) => (
              <div key={incident.id} className="p-4 hover:bg-slate-50/80 transition-colors group relative flex flex-col md:flex-row md:items-center gap-4">
                
                {/* Critical indicator bar */}
                {incident.priority === 'CRITICAL' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                )}
                {incident.priority === 'HIGH' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                )}

                {/* Status / ID */}
                <div className="w-full md:w-48 shrink-0 flex flex-col gap-1.5 md:pl-2">
                  <Link to={`/authority/incidents/${incident.id}`} className="text-[13px] font-black text-slate-900 hover:text-red-600 transition-colors uppercase font-mono">
                    {incident.referenceId || incident.id.slice(0, 8)}
                  </Link>
                  <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                    incident.expired ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {incident.expired && <Clock className="w-3 h-3" />}
                    {!incident.expired && (incident.status || 'OPEN') === 'OPEN' && <AlertTriangle className="w-3 h-3" />}
                    {(incident.status || 'OPEN') === 'IN_PROGRESS' && <Crosshair className="w-3 h-3" />}
                    {(incident.status || 'OPEN') === 'RESOLVED' && <CheckCircle2 className="w-3 h-3" />}
                    {incident.displayStatus || incident.status || 'OPEN'}
                  </div>
                </div>

                {/* Core Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border ${getPriorityColor(incident.priority || 'HIGH')}`}>
                      {incident.priority || 'HIGH'}
                    </span>
                    <span className="text-[13px] font-bold text-slate-800 truncate">
                      {incident.title || incident.type || 'Emergency Reported'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                    <span className="font-bold text-slate-700">{incident.tourist?.name || 'Tourist'}</span>
                    {incident.tourist?.phone && <span>{incident.tourist.phone}</span>}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {incident.latitude != null && incident.longitude != null ? `${Number(incident.latitude).toFixed(5)}, ${Number(incident.longitude).toFixed(5)}` : 'Location unavailable'}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" /> 
                      {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="w-full md:w-auto shrink-0 flex items-center justify-end mt-2 md:mt-0">
                  <Link 
                    to={`/authority/incidents/${incident.id}`}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Take Command <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
