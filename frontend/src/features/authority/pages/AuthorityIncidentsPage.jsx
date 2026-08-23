import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MoreVertical,
  Crosshair,
  MapPin,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

// Mock data based on ENDPOINTS.md incident queue
const MOCK_INCIDENTS = [
  {
    id: 'INC-PRY-9421',
    category: 'Crowd Overcrowding / Stampede Risk',
    severity: 'High',
    status: 'ACTIVE',
    location: 'Sangam Ghat Sector 4, Prayagraj',
    time: '4 mins ago',
    reportedBy: 'Tourist #DTD-PRY-8924',
    assignedTo: 'Patrol PCR Van #14'
  },
  {
    id: 'INC-PRY-9420',
    category: 'Medical Emergency / Heatstroke',
    severity: 'Medium',
    status: 'UNASSIGNED',
    location: 'Daraganj Access Road',
    time: '12 mins ago',
    reportedBy: 'Anonymous',
    assignedTo: null
  },
  {
    id: 'INC-PRY-9419',
    category: 'Lost Person / Child',
    severity: 'Medium',
    status: 'RESOLVED',
    location: 'Kila Road Junction',
    time: '1 hour ago',
    reportedBy: 'Tourist #DTD-PRY-1123',
    assignedTo: 'Sector 2 Control'
  },
  {
    id: 'INC-PRY-9418',
    category: 'CRITICAL SOS ACTIVATION',
    severity: 'Critical',
    status: 'ACTIVE',
    location: 'Mela Sector 7 Tent City',
    time: 'Just now',
    reportedBy: 'Tourist #DTD-PRY-9988',
    assignedTo: 'Rapid Action Force Team B'
  }
];

export function AuthorityIncidentsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredIncidents = MOCK_INCIDENTS.filter(inc => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNASSIGNED') return inc.status === 'UNASSIGNED';
    if (activeTab === 'ACTIVE') return inc.status === 'ACTIVE';
    if (activeTab === 'RESOLVED') return inc.status === 'RESOLVED';
    return true;
  }).sort((a, b) => {
    // Sort critical to top
    if (a.severity === 'Critical' && b.severity !== 'Critical') return -1;
    if (b.severity === 'Critical' && a.severity !== 'Critical') return 1;
    return 0;
  });

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white animate-pulse border border-red-700';
      case 'High': return 'bg-red-50 text-red-700 border border-red-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Low': return 'bg-blue-50 text-blue-700 border border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'UNASSIGNED': return 'text-amber-600 flex items-center gap-1';
      case 'ACTIVE': return 'text-blue-600 flex items-center gap-1';
      case 'RESOLVED': return 'text-emerald-600 flex items-center gap-1';
      default: return 'text-slate-500';
=======
import { 
  AlertTriangle, ShieldAlert, Radio, Search, 
  Filter, MapPin, Clock, ArrowRight, Loader2, ServerCrash 
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

export function AuthorityIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authorityService.getIncidentQueue();
      // Assuming response is an array or object containing an array (adjust if pagination exists)
      const data = response?.data || response || [];
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
>>>>>>> 8e2a7bff0281305b4fc619750e7d48f8b343ea41
    }
  };

  return (
<<<<<<< HEAD
    <div className="space-y-6 font-sans max-w-[1200px] mx-auto pb-8 overflow-hidden">

      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Operational Queue</span>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
          </div>
          <h2 className="text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Incident Dispatch Queue
          </h2>
          <p className="text-[13px] text-slate-500 font-medium mt-1 max-w-xl">
            Live feed of emergency requests, tourist SOS alerts, and active field responder operations.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-md shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer font-bold text-[11px] uppercase tracking-wider">
          <Crosshair className="w-4 h-4" /> Switch to Map View
        </button>
      </div>

      {/* Metrics Row */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-700 delay-100 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Incidents</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900">14</span>
            <span className="text-[10px] font-bold text-red-500 mb-1 flex items-center"><ArrowUpRight className="w-3 h-3" /> 2</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
          </div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest relative z-10">Unassigned</span>
          <div className="flex items-end justify-between relative z-10">
            <span className="text-3xl font-black text-slate-900">03</span>
            <span className="text-[10px] font-bold text-amber-600 mb-1">Needs Dispatch</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Response Time</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900">4.2<span className="text-lg">m</span></span>
            <span className="text-[10px] font-bold text-emerald-500 mb-1">
              Target: {'<'} 5m
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units Deployed</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900">22</span>
            <span className="text-[10px] font-bold text-slate-400 mb-1">of 45 active</span>
=======
    <div className={`font-sans max-w-[1200px] mx-auto pb-10 transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Command Center</span>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
          </div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight">
            Incident Queue
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
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 py-2 rounded-md bg-white text-slate-900 shadow-sm text-[11px] font-bold uppercase tracking-wider transition-all">
            All Active
          </button>
          <button className="flex-1 sm:flex-none px-4 py-2 rounded-md text-slate-500 hover:text-slate-700 text-[11px] font-bold uppercase tracking-wider transition-all">
            Pending Triage
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search incidents..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[12px] font-medium text-slate-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
            />
>>>>>>> 8e2a7bff0281305b4fc619750e7d48f8b343ea41
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Main Queue Interface */}
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-700 delay-200 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

        {/* Filters / Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            {['ALL', 'UNASSIGNED', 'ACTIVE', 'RESOLVED'].map(tab => (
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

        {/* List View */}
        <div className="divide-y divide-slate-100">
          {filteredIncidents.map((incident) => (
            <div key={incident.id} className="p-4 hover:bg-slate-50/80 transition-colors group relative flex flex-col md:flex-row md:items-center gap-4">

              {/* Critical indicator bar */}
              {incident.severity === 'Critical' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
              )}

              {/* Status / ID */}
              <div className="w-full md:w-48 shrink-0 flex flex-col gap-1.5 md:pl-2">
                <Link to={`/authority/incidents/${incident.id}`} className="text-[13px] font-black text-slate-900 hover:text-red-600 transition-colors">
                  {incident.id}
                </Link>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${getStatusStyles(incident.status)}`}>
                  {incident.status === 'UNASSIGNED' && <AlertTriangle className="w-3 h-3" />}
                  {incident.status === 'ACTIVE' && <Crosshair className="w-3 h-3" />}
                  {incident.status === 'RESOLVED' && <CheckCircle2 className="w-3 h-3" />}
                  {incident.status}
                </div>
              </div>

              {/* Core Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest ${getSeverityStyles(incident.severity)}`}>
                    {incident.severity}
                  </span>
                  <span className="text-[13px] font-bold text-slate-800 truncate">{incident.category}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium truncate">
                  <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {incident.location}</span>
                  <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" /> {incident.time}</span>
                </div>
              </div>

              {/* Assignment & Action */}
              <div className="w-full md:w-56 shrink-0 flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assigned</span>
                  {incident.assignedTo ? (
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> {incident.assignedTo}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-500">Awaiting Dispatch</span>
                  )}
                </div>

                <Link to={`/authority/incidents/${incident.id}`}>
                  <button className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group-hover:shadow-sm">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            </div>
          ))}

          {filteredIncidents.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Queue Empty</h3>
              <p className="text-[12px] text-slate-500 font-medium mt-1">No incidents matching the current filter.</p>
            </div>
          )}
        </div>
      </div>
=======
      {/* Content Area */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center mb-6">
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
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {!loading && incidents.length === 0 && !error && (
             <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center">
               <ShieldAlert className="w-10 h-10 text-emerald-400 mb-3" />
               <p className="text-slate-900 font-bold text-[14px]">No Active Incidents</p>
               <p className="text-slate-500 text-[12px] mt-1">The sector is currently clear.</p>
             </div>
          )}

          {incidents.map((incident) => (
            <div key={incident.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row overflow-hidden">
              
              {/* Left Color Bar */}
              <div className={`w-1.5 shrink-0 ${incident.priority === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-400'}`} />
              
              {/* Main Content */}
              <div className="p-5 sm:p-6 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Status & ID */}
                <div className="md:col-span-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${getPriorityColor(incident.priority || 'HIGH')}`}>
                      {incident.priority || 'HIGH'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                      {incident.status || 'PENDING'}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tight font-mono">
                    {incident.referenceId || incident.id}
                  </h3>
                  <p className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(incident.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {/* Description & Location */}
                <div className="md:col-span-6 space-y-2">
                  <p className="text-[14px] font-bold text-slate-800 line-clamp-2 leading-relaxed">
                    {incident.type || incident.title || 'Emergency Medical Situation Reported'}
                  </p>
                  <p className="text-[12px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    Lat: {incident.location?.latitude || 'N/A'}, Lng: {incident.location?.longitude || 'N/A'}
                  </p>
                </div>

                {/* Action */}
                <div className="md:col-span-3 flex justify-end">
                  <Link 
                    to={`/authority/incidents/${incident.id}`}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Take Command <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
>>>>>>> 8e2a7bff0281305b4fc619750e7d48f8b343ea41
    </div>
  );
}
