import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, UserPlus, AlertTriangle, Crosshair, 
  RefreshCw, Loader2, ServerCrash, ShieldAlert 
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

export function AuthorityDispatchPage() {
  const [units, setUnits] = useState([]);
  const [activeDispatches, setActiveDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError('');
      const [response, dispatchRows] = await Promise.all([authorityService.getUnits(), authorityService.getActiveDispatches()]);
      const data = response || [];
      setUnits(Array.isArray(data) ? data : []);
      setActiveDispatches(Array.isArray(dispatchRows) ? dispatchRows : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load dispatch units');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DISPATCHED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ON_SCENE': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'OUT_OF_SERVICE': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="font-sans max-w-[1200px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-slate-800" /> Fleet Dispatch
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Jurisdiction fleet from the backend: police, fire fighting and medical response units.
          </p>
        </div>
        
        <button 
          onClick={fetchUnits}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync Fleet
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center mb-6">
          <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-red-800 font-bold text-sm mb-1">Dispatch Server Error</p>
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {!error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-[28px] font-black text-slate-900">{units.length}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Units</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-[28px] font-black text-emerald-700">{units.filter(u => u.status === 'AVAILABLE').length}</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Available</span>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-[28px] font-black text-blue-700">{units.filter(u => u.status === 'DISPATCHED' || u.status === 'ON_SCENE').length}</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Deployed</span>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-[28px] font-black text-red-700">{units.filter(u => u.status === 'OUT_OF_SERVICE').length}</span>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Offline</span>
          </div>
        </div>
      )}

      {activeDispatches.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Active response tracking</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{activeDispatches.length} active</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {activeDispatches.map((dispatch) => (
              <Link key={dispatch.id} to={`/authority/response/${dispatch.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-400 hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-slate-900">{dispatch.requestedUnitType} · {dispatch.status}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{dispatch.incident?.title || 'Emergency incident'}</p>
                  </div>
                  <Crosshair className="h-4 w-4 text-slate-500" />
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-blue-600">Open live unit tracking →</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Unit Roster */}
      {!error && loading && units.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
          <p className="text-sm font-semibold text-slate-500">Querying unit locators...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!loading && units.length === 0 && !error && (
             <div className="col-span-full bg-slate-50 border border-slate-200 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center">
               <ShieldAlert className="w-10 h-10 text-slate-400 mb-3" />
               <p className="text-slate-900 font-bold text-[14px]">No Units Found</p>
               <p className="text-slate-500 text-[12px] mt-1">There are no units registered in the dispatch database.</p>
             </div>
          )}

          {units.map(unit => (
            <div key={unit.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                    <Car className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{unit.name || unit.callSign || `UNIT-${unit.id.slice(0, 8)}`}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{unit.type || 'PATROL'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${getStatusColor(unit.status || 'AVAILABLE')}`}>
                  {unit.status || 'AVAILABLE'}
                </span>
              </div>
              
              <div className="space-y-3 mt-5 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1.5"><Crosshair className="w-3.5 h-3.5" /> Sector</span>
                  <span className="font-bold text-slate-900">{unit.jurisdiction || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between items-center gap-3 text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /> Organization</span>
                  <span className="font-bold text-slate-900 text-right">{unit.organization || 'Emergency Services'}</span>
                </div>
                {unit.contactPhone && (
                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                    <span>Contact</span><span className="font-mono font-bold text-slate-900">{unit.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
