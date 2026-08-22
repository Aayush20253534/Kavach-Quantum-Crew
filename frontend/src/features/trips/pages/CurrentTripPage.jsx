import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Navigation, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Activity
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="bg-white border border-slate-200 p-8 text-center max-w-2xl mx-auto mt-10">
        <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">No Active Mission</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-6">
          You currently have no planned or active trips.
        </p>
        <Link to="/tourist/trips/create">
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded-none shadow-sm transition-colors cursor-pointer">
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
    <div className="space-y-6 max-w-6xl mx-auto pb-10 font-sans">
      {/* Top Banner */}
      <div className={`p-6 border ${isActive ? 'bg-white border-green-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm'} flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-none`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isActive ? (
              <span className="bg-green-100 text-green-800 border border-green-200 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                LIVE TRIP IN PROGRESS
              </span>
            ) : (
              <span className="bg-orange-100 text-orange-800 border border-orange-200 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                TRIP PLANNED
              </span>
            )}
            <span className="text-[10px] text-slate-500 font-mono font-bold">ID: {currentTrip.id?.substring(0,8).toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            {currentTrip.destination || 'Prayagraj Circuit'}
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            {currentTrip.type} TRIP · {currentTrip.duration}
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {isPlanned && (
             <button 
                onClick={handleStart} 
                disabled={isStarting}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer border border-transparent disabled:opacity-50"
             >
                <Activity className="w-4 h-4" /> Start Mission
             </button>
          )}
          
          <Link to="/tourist/incidents/report" className="w-full">
            <button className="w-full bg-white border border-slate-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700 text-slate-700 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <AlertTriangle className="w-4 h-4" /> Report Hazard
            </button>
          </Link>
        </div>
      </div>

      {gpsError && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs uppercase tracking-wider">Telemetry Warning</p>
            <p className="text-[11px] mt-0.5 font-medium">{gpsError}</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-red-600" />
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Live Geofence Radar</h2>
              </div>
              <div className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider bg-white border border-slate-200 text-slate-600">
                GPS Accuracy: {location ? `${Math.round(location.accuracy)}m` : 'Pending'}
              </div>
            </div>
            <div className="h-[400px] w-full relative bg-slate-100">
               {/* Map View */}
               <MapComponent
                  currentLocation={location}
                  className="w-full h-full"
               />
               
               {/* Status Overlay */}
               {!isActive && (
                 <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-[500] flex items-center justify-center">
                    <div className="bg-white border border-slate-200 p-4 shadow-xl text-center max-w-xs">
                       <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                       <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Radar Offline</h3>
                       <p className="text-[10px] text-slate-500 font-medium mt-1">Start mission to enable live GPS telemetry.</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Col: Actions & Status */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 p-5 shadow-sm">
             <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                Mission Status
             </h2>
             
             <div className="space-y-4">
               <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check-in Policy</span>
                  <span className="text-[11px] font-bold text-slate-900 uppercase">{currentTrip.checkInInterval}</span>
               </div>
               
               {currentTrip.type === 'GROUP' && (
                  <div>
                     <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Group Sync</span>
                     <Link to="/tourist/groups/create" className="text-[11px] font-bold text-red-600 hover:text-red-700 uppercase flex items-center gap-1">
                        Manage Group Members <AlertTriangle className="w-3 h-3" />
                     </Link>
                  </div>
               )}
             </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 shadow-sm text-center">
            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">
              Mission Control
            </h2>
            <div className="space-y-3">
              <button 
                onClick={handleComplete}
                disabled={isCompleting || isPlanned}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors border border-transparent"
              >
                <CheckCircle2 className="w-4 h-4" /> Log Successful Completion
              </button>
              
              <button 
                onClick={handleCancel}
                disabled={isCanceling}
                className="w-full bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-700 hover:text-red-700 px-4 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Abort Mission
              </button>
            </div>
            <p className="text-[9px] text-slate-500 font-medium uppercase mt-4 leading-relaxed">
              Aborting or completing stops all active telemetry and notifies your group members.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
