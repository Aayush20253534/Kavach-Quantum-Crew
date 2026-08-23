import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Loader2, ServerCrash, UserCheck, 
  UserMinus, UserCog, Clock, MapPin
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

export function AuthorityRespondersPage() {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResponders();
  }, []);

  const fetchResponders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authorityService.getResponders();
      const data = response?.data || response || [];
      setResponders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch responders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'BUSY': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'OFF_DUTY': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE': return <UserCheck className="w-3.5 h-3.5" />;
      case 'BUSY': return <UserCog className="w-3.5 h-3.5" />;
      case 'OFF_DUTY': return <UserMinus className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="font-sans max-w-[1200px] mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Command Center</span>
          </div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-800" /> Personnel Roster
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Track disaster manager availability, workloads, and shift schedules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-24">
          <span className="text-3xl font-black text-slate-900">{responders.length}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Personnel</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-24">
          <span className="text-3xl font-black text-emerald-600">{responders.filter(r => (r.status || 'AVAILABLE') === 'AVAILABLE').length}</span>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Available</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-24">
          <span className="text-3xl font-black text-amber-500">{responders.filter(r => r.status === 'BUSY').length}</span>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">On Active Incident</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-24">
          <span className="text-3xl font-black text-slate-400">{responders.filter(r => r.status === 'OFF_DUTY').length}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Off Duty</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Content */}
        {error && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-red-800 font-bold text-sm mb-1">Failed to fetch personnel data</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}

        {!error && loading && responders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
            <p className="text-sm font-semibold text-slate-500">Querying active directory...</p>
          </div>
        ) : !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Officer</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Duty Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Assigned Incidents</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Sector Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && responders.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-500 text-[12px] font-medium">
                      No disaster managers found in the system.
                    </td>
                  </tr>
                )}

                {responders.map((responder) => (
                  <tr key={responder.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-black text-slate-700 uppercase">
                          {responder.name?.substring(0,2) || 'DM'}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">{responder.name || 'Unknown Officer'}</p>
                          <p className="text-[11px] font-medium text-slate-500">{responder.email || 'No contact info'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(responder.status || 'AVAILABLE')}`}>
                        {getStatusIcon(responder.status || 'AVAILABLE')}
                        {responder.status || 'AVAILABLE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[13px] font-black ${responder.incidentCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {responder.incidentCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Active</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {responder.location ? `Lat: ${responder.location.latitude.toFixed(4)}, Lng: ${responder.location.longitude.toFixed(4)}` : 'Location unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
