import React from 'react';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { useGeolocation } from '../hooks/useGeolocation';
import { useRiskZones } from '../api/trackingQueries';
import { MapComponent } from '../components/MapComponent';
import { 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  Wifi, 
  Radio, 
  AlertTriangle,
  BatteryMedium
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export function LiveTrackingPage() {
  const { user } = useSelector((state) => state.auth);
  const { data: currentTrip } = useCurrentTrip();
  
  // Tracking logic
  const isActive = currentTrip?.status === 'ACTIVE';
  const { location, isTracking } = useGeolocation(currentTrip?.id, isActive);
  const { data: riskZonesData } = useRiskZones();
  const riskZones = riskZonesData?.items || riskZonesData || [];

  return (
    <div className="relative w-full h-[calc(100vh-140px)] rounded-lg overflow-hidden border border-slate-200 shadow-md flex flex-col font-sans">
      
      {/* Top Map Overlay / HUD */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-none">
        
        {/* Left Side Status */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-md p-3 shadow-lg pointer-events-auto flex items-center gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center shadow-sm ${
              isTracking ? 'bg-[#f0fdf4] border border-[#dcfce7] text-[#16a34a]' : 'bg-slate-100 border border-slate-200 text-slate-400'
            }`}>
              <Navigation className={`w-5 h-5 ${isTracking ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-wide">
                {isTracking ? 'GPS Tracking Active' : 'GPS Offline'}
              </h2>
              <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest mt-0.5">
                <Wifi className="w-3 h-3" /> Signal Strong
              </p>
            </div>
          </div>
          
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current Zone</p>
            <p className="text-[13px] font-bold text-[#16a34a] flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Sangam Safe Zone
            </p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button className="w-12 h-12 bg-white/95 backdrop-blur-md border border-slate-200 rounded-md shadow-lg flex items-center justify-center text-slate-700 hover:text-[#e11d48] hover:border-red-200 transition-colors cursor-pointer" title="Report Hazard">
            <AlertTriangle className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 bg-white/95 backdrop-blur-md border border-slate-200 rounded-md shadow-lg flex items-center justify-center text-slate-700 hover:text-sky-500 hover:border-sky-200 transition-colors cursor-pointer" title="Center Map">
            <CrosshairIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* The Actual Map Layer */}
      <div className="flex-1 w-full h-full bg-slate-100 z-0 relative">
        {/* Placeholder / Error state if no location (though MapComponent usually handles this) */}
        {!isTracking && !location && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-sm z-20">
            <Radio className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-[16px] font-black text-slate-700 uppercase tracking-wide">Tracking Paused</h3>
            <p className="text-[13px] font-medium text-slate-500 max-w-md text-center mt-2">
              Start a trip or enable GPS permissions to begin live tracking.
            </p>
            <Link to="/tourist/trips/create">
              <button className="mt-6 px-6 py-3 bg-[#e11d48] hover:bg-[#be123c] text-white text-[12px] font-bold uppercase tracking-widest rounded-md shadow-sm transition-colors">
                Start Trip Now
              </button>
            </Link>
          </div>
        )}

        <MapComponent
          currentLocation={location}
          riskZones={riskZones}
          className="w-full h-full"
        />
      </div>

      {/* Bottom Floating Telemetry Panel */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[95%] max-w-xl pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-4 shadow-xl pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Companion Sync</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse"></span>
                <span className="text-[13px] font-bold text-slate-900">4 Online</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Battery</p>
              <div className="flex items-center gap-1.5 text-slate-900">
                <BatteryMedium className="w-4 h-4 text-[#16a34a]" />
                <span className="text-[13px] font-bold">88%</span>
              </div>
            </div>
          </div>
          
          <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-md shadow-sm transition-colors">
            Share Live Location
          </button>
        </div>
      </div>
      
    </div>
  );
}

// Inline Crosshair icon since it might not be imported at the top
function CrosshairIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="22" x2="18" y1="12" y2="12" />
      <line x1="6" x2="2" y1="12" y2="12" />
      <line x1="12" x2="12" y1="6" y2="2" />
      <line x1="12" x2="12" y1="22" y2="18" />
    </svg>
  );
}
