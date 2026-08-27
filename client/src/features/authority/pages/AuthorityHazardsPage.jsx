import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Eye, EyeOff, Loader2, ServerCrash, 
  CheckCircle2, XCircle, MapPin, Clock, Search, Filter 
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

export function AuthorityHazardsPage() {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING');

  useEffect(() => {
    fetchHazards();
  }, []);

  const fetchHazards = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authorityService.getHazards();
      const data = response || [];
      setHazards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch hazards');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, hazardId) => {
    try {
      if (action === 'VERIFY') {
        await authorityService.verifyHazard(hazardId);
      } else if (action === 'REJECT') {
        await authorityService.rejectHazard(hazardId);
      } else if (action === 'RESOLVE') {
        await authorityService.resolveHazard(hazardId);
      }
      fetchHazards();
    } catch (err) {
      alert(err.response?.data?.error?.message || `Failed to ${action.toLowerCase()} hazard`);
    }
  };

  const filteredHazards = hazards.filter(h => {
    const status = (h.status || 'PENDING').toUpperCase();
    if (activeTab === 'ALL') return true;
    return status === activeTab;
  });

  return (
    <div className="font-sans max-w-[1200px] mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">Command Center</span>
          </div>
          <h1 className="text-[22px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" /> Hazard Triage Queue
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Review and verify community-reported hazards and non-critical alerts.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            {['PENDING', 'VERIFIED', 'RESOLVED', 'REJECTED', 'ALL'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {error && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-red-800 font-bold text-sm mb-1">Failed to fetch hazards</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}

        {!error && loading && hazards.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
            <p className="text-sm font-semibold text-slate-500">Querying database...</p>
          </div>
        ) : !error && (
          <div className="divide-y divide-slate-100">
            {!loading && filteredHazards.length === 0 && (
               <div className="p-12 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                   <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                 </div>
                 <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Queue Empty</h3>
                 <p className="text-[12px] text-slate-500 font-medium mt-1">No hazards matching the current filter.</p>
               </div>
            )}

            {filteredHazards.map((hazard) => (
              <div key={hazard.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${
                      hazard.status === 'PENDING' ? 'bg-amber-50 text-slate-950 border-amber-200' :
                      hazard.status === 'VERIFIED' ? 'bg-red-50 text-red-700 border-red-200' :
                      hazard.status === 'RESOLVED' ? 'bg-emerald-50 text-slate-950 border-emerald-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {hazard.status || 'PENDING'}
                    </span>
                    <h3 className="text-[15px] font-black text-slate-900">{hazard.type || 'Unknown Hazard'}</h3>
                  </div>
                  
                  <p className="text-[13px] text-slate-600 font-medium leading-relaxed max-w-3xl">
                    {hazard.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> 
                      {hazard.locationName ? `${hazard.locationName} · ` : ''}{Number(hazard.latitude).toFixed(5)}, {Number(hazard.longitude).toFixed(5)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> 
                      {hazard.createdAt ? new Date(hazard.createdAt).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  {(hazard.status || 'PENDING') === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => handleAction('VERIFY', hazard.id)}
                        className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Verify Hazard
                      </button>
                      <button 
                        onClick={() => handleAction('REJECT', hazard.id)}
                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {(hazard.status || 'PENDING') === 'VERIFIED' && (
                    <button 
                      onClick={() => handleAction('RESOLVE', hazard.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm w-full md:w-auto flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
