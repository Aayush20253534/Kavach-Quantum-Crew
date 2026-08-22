import React from 'react';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { useGeolocation } from '../../tracking/hooks/useGeolocation';
import { useRiskZones, useLatestLocations } from '../../tracking/api/trackingQueries';
import { MapComponent } from '../../tracking/components/MapComponent';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, ArrowRight, ShieldAlert, Activity, Star } from 'lucide-react';

const SUGGESTED_PLACES = [
  {
    id: 1,
    name: 'Triveni Sangam',
    description: 'The holy confluence of three rivers',
    image: '/destinations/sangam.jpg',
    distance: '3.2 km',
  },
  {
    id: 2,
    name: 'Hanuman Temple',
    description: 'Famous reclining Hanuman idol',
    image: '/destinations/temple.jpg',
    distance: '1.5 km',
  },
  {
    id: 3,
    name: 'Allahabad Fort',
    description: 'Historic fort built by Emperor Akbar',
    image: '/destinations/fort.jpg',
    distance: '4.8 km',
  },
  {
    id: 4,
    name: 'Kumbh Mela Grounds',
    description: 'Site of the largest religious gathering',
    image: '/destinations/kumbh.jpg',
    distance: '2.1 km',
  }
];

export function TouristDashboardPage() {
  const { data: currentTrip } = useCurrentTrip();

  // Track location if there's a trip that is active.
  const isActive = currentTrip?.status === 'ACTIVE';

  // The hook watches GPS and sends pings silently in the background
  const { location, permission, error: gpsError } = useGeolocation(currentTrip?.id, isActive);

  // Fetch risk zones (cached 15 mins)
  const { data: riskZonesData } = useRiskZones();
  const riskZones = riskZonesData?.items || riskZonesData || [];

  // Fetch other group members if it's a group trip
  const isGroup = currentTrip?.type === 'GROUP';
  const { data: groupLocations } = useLatestLocations(isGroup ? currentTrip?.groupId : null);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Tourist Command Center</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Live Tracking & Safety Analytics</p>
        </div>
        
        {isActive && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 border border-green-200 text-xs font-bold uppercase tracking-wider shadow-sm rounded-none">
            <span className="w-2 h-2 bg-green-500 rounded-none animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            Active Telemetry
          </div>
        )}
      </div>

      {/* Suggested Places (Vibrant Image Cards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-red-600" />
            Top Destinations in Prayagraj
          </h2>
          <button className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition flex items-center gap-1 cursor-pointer">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUGGESTED_PLACES.map((place) => (
            <div 
              key={place.id} 
              className="group relative h-48 rounded-none overflow-hidden cursor-pointer border border-slate-200 shadow-sm"
            >
              {/* Vibrant Background Image */}
              <img 
                src={place.image}
                alt={place.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Dark Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              
              {/* Vibrant Hover Overlay */}
              <div className="absolute inset-0 bg-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay" />
              
              {/* Content */}
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-black text-sm uppercase tracking-wide leading-tight shadow-black drop-shadow-md">{place.name}</h3>
                    <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 border border-white/30 text-white text-[9px] font-bold uppercase tracking-wider rounded-none">
                      {place.distance}
                    </div>
                  </div>
                  <p className="text-slate-300 text-[10px] font-medium leading-snug line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {place.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Conditional Trip / GPS Warnings */}
      <div className="space-y-4">
        {!isActive && permission === 'prompt' && currentTrip?.status === 'PLANNED' && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 p-6 shadow-xl border border-red-700 rounded-none flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
              <Navigation className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10 text-white">
              <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-5 h-5 animate-pulse" />
                Ready to Deploy?
              </h3>
              <p className="text-xs font-medium text-red-100 mt-1 uppercase tracking-wider">
                Initiate your trip to establish secure GPS uplinks with local first responders.
              </p>
            </div>
            <Link 
              to="/tourist/trips/current" 
              className="relative z-10 bg-white text-red-700 px-6 py-3 font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-slate-50 transition-colors rounded-none border border-white whitespace-nowrap"
            >
              Start Mission
            </Link>
          </div>
        )}

        {gpsError && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-900 p-4 shadow-sm flex items-start gap-3 rounded-none">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Telemetry Warning</p>
              <p className="text-[11px] mt-0.5 font-medium">{gpsError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Premium HUD Map Container */}
      <div className="relative bg-white shadow-xl border border-slate-200 overflow-hidden rounded-none group">
        
        {/* HUD Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-[400] pointer-events-none p-4 flex justify-between items-start">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-3 pointer-events-auto shadow-2xl rounded-none flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 flex items-center justify-center border border-slate-700 rounded-none">
              <MapPin className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="font-black text-white text-xs uppercase tracking-widest">Tactical Map</h2>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 block rounded-none animate-pulse"></span>
                LINK ESTABLISHED
              </p>
            </div>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-3 py-1.5 pointer-events-auto shadow-2xl rounded-none">
            <span className="text-[9px] text-slate-300 font-mono tracking-wider">
              ACCURACY: <strong className="text-white">{location ? `${Math.round(location.accuracy)}M` : 'CALCULATING...'}</strong>
            </span>
          </div>
        </div>

        {/* HUD Crosshairs/Corners (Visual only) */}
        <div className="absolute inset-0 pointer-events-none z-[400]">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-slate-900/30 m-4 transition-transform group-hover:scale-110"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-900/30 m-4 transition-transform group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-slate-900/30 m-4 transition-transform group-hover:scale-110"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-slate-900/30 m-4 transition-transform group-hover:scale-110"></div>
        </div>

        {/* Render our Leaflet Map */}
        <MapComponent
          currentLocation={location}
          riskZones={riskZones}
          groupLocations={Array.isArray(groupLocations) ? groupLocations : []}
          className="h-[550px] w-full z-0 grayscale-[0.2] contrast-125"
        />
        
        {/* HUD Bottom Bar Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-[400] pointer-events-none p-4 flex justify-center">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-2 shadow-2xl rounded-none flex items-center gap-6 pointer-events-auto">
             <div className="flex flex-col items-center">
               <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Longitude</span>
               <span className="text-xs text-slate-200 font-mono">{location?.longitude?.toFixed(4) || '---.----'}</span>
             </div>
             <div className="w-px h-6 bg-slate-700"></div>
             <div className="flex flex-col items-center">
               <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Latitude</span>
               <span className="text-xs text-slate-200 font-mono">{location?.latitude?.toFixed(4) || '---.----'}</span>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
