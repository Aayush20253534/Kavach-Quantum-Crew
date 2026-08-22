import React from 'react';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { useGeolocation } from '../../tracking/hooks/useGeolocation';
import { useRiskZones, useLatestLocations } from '../../tracking/api/trackingQueries';
import { useAlerts } from '../../safety/api/safetyQueries';
import { MapComponent } from '../../tracking/components/MapComponent';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, ArrowRight, ShieldAlert, Activity, Star, AlertTriangle } from 'lucide-react';

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
  const { data: alertsData } = useAlerts();

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

  const alerts = alertsData?.items || alertsData || [];
  const unreadAlerts = alerts.filter(a => !a.acknowledgedAt);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10 font-sans">
      
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

      {/* Conditional Trip / GPS Warnings & Alerts */}
      <div className="space-y-4">
        {unreadAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-900 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-none">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-red-700">Action Required: {unreadAlerts.length} Unread Alerts</p>
                <p className="text-[11px] mt-0.5 font-medium text-red-600">You have unacknowledged safety alerts in your vicinity.</p>
              </div>
            </div>
            <Link 
              to="/tourist/incidents/history" 
              className="bg-red-600 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shrink-0"
            >
              View Alerts
            </Link>
          </div>
        )}

        {!isActive && currentTrip?.status === 'PLANNED' && (
          <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-none flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                  Ready to Deploy?
                </h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5 uppercase tracking-wider">
                  Initiate your planned trip to establish secure GPS uplinks with local first responders.
                </p>
              </div>
            </div>
            <Link 
              to="/tourist/trips/current" 
              className="bg-slate-900 text-white px-6 py-3 font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors border border-transparent whitespace-nowrap"
            >
              Start Mission
            </Link>
          </div>
        )}

        {gpsError && (
          <div className="bg-white border border-red-200 text-red-900 p-4 shadow-sm flex items-start gap-3 rounded-none relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5 ml-2" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Telemetry Warning</p>
              <p className="text-[11px] mt-0.5 font-medium">{gpsError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Places (Flat UI Update) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-red-600" />
            Top Destinations in Prayagraj
          </h2>
          <button className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-600 transition flex items-center gap-1 cursor-pointer">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUGGESTED_PLACES.map((place) => (
            <div 
              key={place.id} 
              className="group relative h-48 bg-white overflow-hidden cursor-pointer border border-slate-200 shadow-sm hover:border-red-400 transition-colors flex flex-col"
            >
              <div className="h-32 relative overflow-hidden bg-slate-100">
                {/* Fallback pattern if no image */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                <img 
                  src={place.image}
                  alt={place.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between bg-white border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-slate-900 font-bold text-[11px] uppercase tracking-wide leading-tight line-clamp-1 group-hover:text-red-600 transition-colors">{place.name}</h3>
                  <div className="bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 shrink-0">
                    {place.distance}
                  </div>
                </div>
                <p className="text-slate-500 text-[9px] font-medium leading-snug line-clamp-1 uppercase">
                  {place.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flat UI HUD Map Container */}
      <div className="relative bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Top Info Bar */}
        <div className="bg-white border-b border-slate-200 p-3 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-50 flex items-center justify-center border border-red-100">
              <MapPin className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Tactical Map</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 block animate-pulse"></span>
                LINK ESTABLISHED
              </p>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 flex items-center gap-2">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              ACCURACY:
            </span>
            <span className="text-[10px] text-slate-900 font-mono font-bold">
              {location ? `${Math.round(location.accuracy)}M` : 'CALCULATING...'}
            </span>
          </div>
        </div>

        {/* Render our Leaflet Map */}
        <div className="relative">
          <MapComponent
            currentLocation={location}
            riskZones={riskZones}
            groupLocations={Array.isArray(groupLocations) ? groupLocations : []}
            className="h-[500px] w-full z-0"
          />
          
          {/* Flat Floating Coordinates Overlay */}
          <div className="absolute bottom-4 left-4 z-[400] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-2.5 shadow-sm flex items-center gap-4 pointer-events-auto">
               <div className="flex flex-col">
                 <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Longitude</span>
                 <span className="text-[11px] text-slate-900 font-mono font-bold">{location?.longitude?.toFixed(4) || '---.----'}</span>
               </div>
               <div className="w-px h-6 bg-slate-200"></div>
               <div className="flex flex-col">
                 <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Latitude</span>
                 <span className="text-[11px] text-slate-900 font-mono font-bold">{location?.latitude?.toFixed(4) || '---.----'}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
