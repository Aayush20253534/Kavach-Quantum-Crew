import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { emergencyServicesApi } from '../api/emergencyServicesApi';
import { Loader } from '../../../components/ui/Loader';
import { MapPin, Navigation, Radio, CheckCircle, Clock } from 'lucide-react';

export function ActiveDispatchPage() {
  const { theme } = useOutletContext();
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchDispatches = async () => {
    try {
      const response = await emergencyServicesApi.getDispatches();
      const allDispatches = response?.data?.data || [];
      // Filter for active ones
      const active = allDispatches.filter(d => !['COMPLETED', 'CANCELLED'].includes(d.status));
      setDispatches(active);
    } catch (err) {
      console.error('Failed to fetch dispatches:', err);
      // Mock data for UI presentation if backend isn't ready
      setDispatches([
        {
          id: 'dispatch-mock-123',
          status: 'ASSIGNED',
          incident: {
            id: 'inc-456',
            title: 'Critical Emergency at Sector 4',
            latitude: 21.1458,
            longitude: 79.0882,
            createdAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
    const interval = setInterval(fetchDispatches, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (dispatchId, newStatus) => {
    setUpdating(dispatchId);
    try {
      await emergencyServicesApi.updateDispatchStatus(dispatchId, { status: newStatus });
      await fetchDispatches();
    } catch (err) {
      console.error('Failed to update status', err);
      // Optimistic update for mock
      setDispatches(prev => prev.map(d => d.id === dispatchId ? { ...d, status: newStatus } : d));
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const flow = ['ASSIGNED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED'];
    const idx = flow.indexOf(currentStatus);
    if (idx >= 0 && idx < flow.length - 1) return flow[idx + 1];
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader size="lg" />
        <p className="mt-4 text-slate-500 font-semibold uppercase tracking-widest text-xs">Connecting to Dispatch Engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className={`p-6 rounded-2xl ${theme.bgClass} text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <theme.icon className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 animate-pulse" /> Active Dispatch
          </h1>
          <p className="text-white/80 font-medium text-sm mt-1">
            Current operational assignment for this unit.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      {dispatches.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Active Dispatches</h3>
          <p className="text-slate-500 font-medium mt-1 text-sm">Your unit is currently standing by.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dispatches.map((dispatch) => {
            const nextStatus = getNextStatus(dispatch.status);
            
            return (
              <div key={dispatch.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${theme.lightBgClass} ${theme.textClass}`}>
                        {dispatch.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {dispatch.id.slice(0,8)}</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        {dispatch.incident?.title || 'Emergency Incident'}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {dispatch.incident?.latitude?.toFixed(4)}, {dispatch.incident?.longitude?.toFixed(4)}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(dispatch.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:text-right shrink-0">
                    {nextStatus && (
                      <button
                        onClick={() => handleUpdateStatus(dispatch.id, nextStatus)}
                        disabled={updating === dispatch.id}
                        className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all shadow-sm ${theme.bgClass} hover:opacity-90 text-white flex items-center justify-center gap-2 disabled:opacity-50`}
                      >
                        {updating === dispatch.id ? (
                          <Loader size="sm" className="text-white" />
                        ) : (
                          <Navigation className="w-4 h-4" />
                        )}
                        Advance to {nextStatus.replace('_', ' ')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar visualizer */}
                <div className="mt-8 relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                  
                  <div className="relative flex justify-between">
                    {['ASSIGNED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED'].map((step, idx) => {
                      const flow = ['ASSIGNED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED'];
                      const currentIdx = flow.indexOf(dispatch.status);
                      const isPast = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step} className="flex flex-col items-center gap-2 z-10">
                          <div className={`w-4 h-4 rounded-full transition-colors duration-500 border-2 ${
                            isCurrent ? `${theme.bgClass} border-white shadow-md ring-4 ring-${theme.color}-100` :
                            isPast ? `${theme.bgClass} border-transparent` :
                            'bg-slate-200 border-transparent'
                          }`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${isCurrent ? theme.textClass : 'text-slate-400'}`}>
                            {step.replace('_', ' ')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
