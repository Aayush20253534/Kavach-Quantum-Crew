import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    }
  };

  return (
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
          </div>
        </div>
      </div>

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
    </div>
  );
}
