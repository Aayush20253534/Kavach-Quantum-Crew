import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, Plus, Loader2, CheckCircle2, 
  AlertTriangle, ServerCrash, X
} from 'lucide-react';
import { tripService } from '../../trips/api/tripService';

export function TouristCheckinsPage() {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tripId, setTripId] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const tripResponse = await tripService.getCurrentTrip();
      if (!tripResponse?.data) {
        setLoading(false);
        return; // No active trip
      }
      
      const tId = tripResponse.data.id;
      setTripId(tId);
      
      const checks = await tripService.getCheckIns(tId);
      setCheckIns(Array.isArray(checks?.data) ? checks.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load safety data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!tripId || !newTime) return;
    try {
      // In a real app we'd construct a proper ISO datetime, here just sending a string
      await tripService.scheduleCheckIn(tripId, { scheduledFor: newTime });
      setShowModal(false);
      setNewTime('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to schedule');
    }
  };

  const handleComplete = async (checkInId) => {
    try {
      await tripService.completeCheckIn(checkInId, { location: { latitude: 0, longitude: 0 } });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to complete check-in');
    }
  };

  return (
    <div className="font-sans max-w-[800px] mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Safety Protocols</span>
          </div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" /> Safety Check-ins
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Schedule a "Dead Man's Switch" check-in. If you fail to verify your safety by the deadline, authorities are notified.
          </p>
        </div>
        
        {tripId && (
          <button 
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule New
          </button>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-10 flex flex-col items-center justify-center text-center">
          <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-red-800 font-bold text-sm mb-1">Connection Error</p>
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading safety schedule...</p>
        </div>
      ) : !tripId ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
          <h3 className="text-[16px] font-black text-slate-900 mb-2">No Active Trip</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Safety check-ins can only be scheduled while you are on an active trip.
          </p>
        </div>
      ) : checkIns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center border-dashed">
          <Clock className="w-10 h-10 text-slate-300 mb-4" />
          <h3 className="text-[16px] font-black text-slate-900 mb-2">No Check-ins Scheduled</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            You don't have any pending safety checks. Schedule one to ensure someone checks on you if you go offline.
          </p>
          <button 
            onClick={() => setShowModal(true)}
            className="px-5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
          >
            Create First Check-in
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {checkIns.map(check => (
            <div key={check.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  check.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                  check.status === 'MISSED' ? 'bg-red-100 text-red-600' :
                  'bg-indigo-100 text-indigo-600'
                }`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-900">
                    Scheduled for {new Date(check.scheduledFor).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold uppercase tracking-widest">
                    <span className={
                      check.status === 'COMPLETED' ? 'text-emerald-600' :
                      check.status === 'MISSED' ? 'text-red-600' :
                      'text-indigo-600'
                    }>
                      {check.status || 'PENDING'}
                    </span>
                    {check.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                </div>
              </div>
              
              {check.status === 'PENDING' && (
                <button 
                  onClick={() => handleComplete(check.id)}
                  className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors"
                >
                  Confirm Safe
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Schedule Check-in</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSchedule} className="p-6">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">Check-in Time</label>
              <input 
                type="datetime-local" 
                required
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[13px] text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
              
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
