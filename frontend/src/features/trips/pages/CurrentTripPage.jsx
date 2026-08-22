import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Navigation, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Activity,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { useCurrentTrip, useCompleteTrip, useCancelTrip, useStartTrip } from '../api/tripQueries';
import { useGeolocation } from '../../tracking/hooks/useGeolocation';
import { MapComponent } from '../../tracking/components/MapComponent';

export function CurrentTripPage() {
  const navigate = useNavigate();
  const { data: currentTrip, isLoading } = useCurrentTrip();
  
  const { mutate: completeTrip, isPending: isCompleting } = useCompleteTrip();
  const { mutate: cancelTrip, isPending: isCanceling } = useCancelTrip();
  const { mutate: startTrip, isPending: isStarting } = useStartTrip();

  const isActive = currentTrip?.status === 'ACTIVE';
  const isPlanned = currentTrip?.status === 'PLANNED';

  // Use actual geolocation tracking if the trip is active
  const { location, error: gpsError } = useGeolocation(currentTrip?.id, isActive);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="bg-white border border-slate-100 p-12 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center max-w-2xl mx-auto mt-10">
        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
          <Navigation className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-[18px] font-black text-slate-900 tracking-wide mb-2">No Active Mission</h2>
        <p className="text-[13px] text-slate-500 font-medium mb-8">
          You currently have no planned or active trips.
        </p>
        <Link to="/tourist/trips/create">
          <button className="bg-[#e11d48] hover:bg-[#be123c] text-white px-8 py-3 rounded-md font-bold text-[13px] tracking-wide shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] transition-all active:scale-95 cursor-pointer">
            Plan New Trip
          </button>
        </Link>
      </div>
    );
  }

  const handleStart = () => {
    startTrip(currentTrip.id);
  };

  const handleComplete = () => {
    completeTrip(currentTrip.id, {
      onSuccess: () => navigate('/tourist/trips/history')
    });
  };

  const handleCancel = () => {
    cancelTrip(currentTrip.id, {
      onSuccess: () => navigate('/tourist/dashboard')
    });
  };

  return (
    <div className={`space-y-6 max-w-[1200px] mx-auto pb-10 font-sans transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      {/* Top Banner */}
      <div className={`p-6 md:p-8 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.03)] border transition-all ${isActive ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 'bg-white border-slate-100'} flex flex-col sm:flex-row sm:items-center justify-between gap-6`}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {isActive ? (
              <span className="bg-[#16a34a] text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                LIVE IN PROGRESS
              </span>
            ) : (
              <span className="bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-lg shadow-sm">
                TRIP PLANNED
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-mono font-bold bg-white/50 px-2 py-0.5 rounded-md border border-slate-200/50">ID: {currentTrip.id?.substring(0,8).toUpperCase()}</span>
          </div>
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-none">
            {currentTrip.destination || 'Prayagraj Circuit'}
          </h1>
          <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="text-slate-900">{currentTrip.type} TRIP</span> 
            <span className="w-1 h-1 rounded-full bg-slate-300"></span> 
            {currentTrip.duration}
          </p>
        </div>

        <div className="flex flex-col gap-3 shrink-0 sm:w-64">
          {isPlanned && (
             <button 
                onClick={handleStart} 
                disabled={isStarting}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white px-6 py-3.5 rounded-md text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] transition-all active:scale-95 disabled:opacity-50"
             >
                <Activity className="w-4 h-4" /> Start Mission
             </button>
          )}
          
          <Link to="/tourist/incidents/report" className="w-full">
            <button className="w-full bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 px-6 py-3 rounded-md text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
              <AlertTriangle className="w-4 h-4" /> Report Hazard
            </button>
          </Link>
        </div>
      </div>

      {gpsError && (
        <div className="bg-[#fef2f2] border border-[#fecaca] p-4 rounded-md shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs uppercase tracking-wider text-[#b91c1c]">Telemetry Warning</p>
            <p className="text-[12px] mt-0.5 font-medium text-[#991b1b]">{gpsError}</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-red-600" />
                </div>
                <h2 className="text-[14px] font-black text-slate-900 tracking-wide">Live Geofence Radar</h2>
              </div>
              <div className="text-[10px] font-bold px-3 py-1 uppercase tracking-wider bg-slate-50 border border-slate-100 rounded-lg text-slate-600 shadow-sm">
                GPS Accuracy: {location ? `${Math.round(location.accuracy)}m` : 'Pending'}
              </div>
            </div>
            <div className="h-[450px] w-full relative bg-slate-100">
               <MapComponent
                  currentLocation={location}
                  className="w-full h-full absolute inset-0 z-0"
               />
               
               {!isActive && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[500] flex items-center justify-center">
                    <div className="bg-white border border-slate-100 p-6 rounded-lg shadow-xl text-center max-w-xs">
                       <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                         <MapPin className="w-8 h-8 text-slate-300" />
                       </div>
                       <h3 className="text-[15px] font-black text-slate-900 tracking-wide">Radar Offline</h3>
                       <p className="text-[12px] text-slate-500 font-medium mt-2">Start mission to enable live GPS telemetry tracking.</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Col: Actions & Status */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-100 rounded-lg p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
             <h2 className="text-[14px] font-black text-slate-900 tracking-wide border-b border-slate-50 pb-4 mb-5">
                Mission Status
             </h2>
             
             <div className="space-y-5">
               <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Check-in Policy</span>
                  <span className="text-[13px] font-black text-slate-900 uppercase tracking-wide">{currentTrip.checkInInterval}</span>
               </div>
               
               {currentTrip.type === 'GROUP' && (
                  <div className="bg-red-50 p-4 rounded-md border border-red-100">
                     <span className="block text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Group Sync</span>
                     <Link to="/tourist/groups/create" className="text-[12px] font-bold text-red-600 hover:text-red-700 uppercase flex items-center gap-1.5">
                        Manage Group Members <AlertTriangle className="w-3.5 h-3.5" />
                     </Link>
                  </div>
               )}
             </div>
          </div>

          <div className="bg-[#1a1f2c] border border-slate-800 rounded-lg p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-slate-400" />
            </div>
            <h2 className="text-[14px] font-black text-white tracking-wide mb-6">
              Mission Control
            </h2>
            <div className="space-y-3">
              <button 
                onClick={handleComplete}
                disabled={isCompleting || isPlanned}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white px-4 py-3.5 rounded-md text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" /> Log Successful Completion
              </button>
              
              <button 
                onClick={handleCancel}
                disabled={isCanceling}
                className="w-full bg-slate-800 hover:bg-[#ef4444] text-slate-300 hover:text-white px-4 py-3.5 rounded-md text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Abort Mission
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-6 leading-relaxed">
              Aborting or completing stops all active telemetry and notifies your group members.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
