import React, { useState, useEffect } from 'react';
import { 
  Map, ShieldAlert, Navigation, Plus, 
  Trash2, Loader2, ServerCrash, CheckCircle2 
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

export function AuthorityRiskZonesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authorityService.getRiskZones();
      const data = response?.data || response || [];
      setZones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load risk zones');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleZone = async (zone) => {
    try {
      if (zone.status === 'ACTIVE') {
        await authorityService.deactivateRiskZone(zone.id);
      } else {
        await authorityService.activateRiskZone(zone.id);
      }
      fetchZones();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to change zone status');
    }
  };

  return (
    <div className="font-sans max-w-[1200px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Map className="w-6 h-6 text-slate-800" /> Tactical Risk Zones
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Draw and manage active geo-fenced perimeters and high-risk areas.
          </p>
        </div>
        
        <button 
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 border border-red-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-red-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Draw New Zone
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Map */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden h-[500px] relative flex flex-col items-center justify-center">
            {/* Geo-Spatial Map Placeholder */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <div className="absolute right-4 top-4 bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20 text-white">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-2"><Navigation className="w-3.5 h-3.5 text-blue-400" /> Map Legend</div>
               <div className="space-y-2 text-[10px] font-medium">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/40 border border-red-500 rounded"></div> Critical Hazard</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500/40 border border-orange-500 rounded"></div> Elevated Risk</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500/40 border border-emerald-500 rounded"></div> Safe Haven</div>
               </div>
            </div>
            
            {zones.map((zone, idx) => {
              if (zone.status !== 'ACTIVE') return null;
              const isDanger = zone.type === 'DANGER' || zone.riskLevel === 'HIGH';
              const color = isDanger ? 'red' : 'emerald';
              return (
                <div key={zone.id || idx} className={`absolute w-32 h-32 bg-${color}-500/20 border-2 border-${color}-500/50 rounded-full flex items-center justify-center animate-pulse`}
                  style={{ top: `${30 + (idx * 20)}%`, left: `${30 + (idx * 20)}%` }}
                >
                  <span className={`text-[8px] font-bold uppercase tracking-widest text-${color}-400 bg-slate-900/80 px-2 py-0.5 rounded`}>
                    {zone.name || `ZONE ${idx+1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Zones List */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[500px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" /> Active Perimeters
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error ? (
               <div className="flex flex-col items-center justify-center text-center py-10">
                 <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
                 <p className="text-red-800 font-bold text-sm mb-1">Data Error</p>
                 <p className="text-red-600 text-xs">{error}</p>
               </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300 mb-3" />
                <p className="text-xs font-semibold text-slate-500">Loading perimeters...</p>
              </div>
            ) : zones.length === 0 ? (
              <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-10">No zones defined</p>
            ) : (
              zones.map((zone) => (
                <div key={zone.id} className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">{zone.name || `Perimeter ${zone.id.substring(0,6)}`}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                      zone.status === 'ACTIVE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {zone.status || 'INACTIVE'}
                    </span>
                  </div>
                  
                  <p className="text-[11px] font-medium text-slate-500 mb-4 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-slate-400" />
                    Radius: {zone.radius || 1000}m
                  </p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleToggleZone(zone)}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                        zone.status === 'ACTIVE' 
                          ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {zone.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
