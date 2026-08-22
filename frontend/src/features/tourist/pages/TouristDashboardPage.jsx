import React from 'react';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { useGeolocation } from '../../tracking/hooks/useGeolocation';
import { useRiskZones, useLatestLocations } from '../../tracking/api/trackingQueries';
import { useAlerts } from '../../safety/api/safetyQueries';
import { MapComponent } from '../../tracking/components/MapComponent';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Bell, 
  ShieldCheck, 
  Clock, 
  Star, 
  ArrowRight,
  MapPin,
  Calendar,
  ChevronDown,
  Navigation,
  Crosshair
} from 'lucide-react';
import { useSelector } from 'react-redux';

const TOP_DESTINATIONS = [
  {
    id: 1,
    name: 'TRIVENI SANGAM',
    location: 'Sangam Sector',
    image: '/destinations/sangam.jpg',
    distance: '3.2 KM',
  },
  {
    id: 2,
    name: 'HANUMAN TEMPLE',
    location: 'Daraganj',
    image: '/destinations/temple.jpg',
    distance: '1.5 KM',
  },
  {
    id: 3,
    name: 'ALLAHABAD FORT',
    location: 'Kila Road',
    image: '/destinations/fort.jpg',
    distance: '4.8 KM',
  },
  {
    id: 4,
    name: 'KUMBH MELA GROUNDS',
    location: 'Mela Sector',
    image: '/destinations/kumbh.jpg',
    distance: '2.1 KM',
  }
];

export function TouristDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const userName = user?.name?.split(' ')[0] || 'Aayansh';

  // Tracking Logic (keeping it for the map)
  const { data: currentTrip } = useCurrentTrip();
  const isActive = currentTrip?.status === 'ACTIVE';
  const { location } = useGeolocation(currentTrip?.id, isActive);
  const { data: riskZonesData } = useRiskZones();
  const riskZones = riskZonesData?.items || riskZonesData || [];
  
  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, {userName}! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Monitor live activity, track safety metrics & stay informed.
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
          <Calendar className="w-4 h-4 text-slate-400" />
          Today
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* TOTAL TOURISTS */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#f5f3ff] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#8b5cf6]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tourists</p>
            <div className="flex items-end gap-2 mb-0.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">1,24,580</h3>
              <span className="text-[11px] font-bold text-[#16a34a] flex items-center">
                <svg className="w-3 h-3 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                12.5%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">vs yesterday</p>
          </div>
        </div>

        {/* ACTIVE ALERTS */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#fef2f2] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Alerts</p>
            <div className="flex items-end gap-2 mb-0.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">07</h3>
              <span className="text-[11px] font-bold text-[#ef4444] flex items-center">
                <svg className="w-3 h-3 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">vs yesterday</p>
          </div>
        </div>

        {/* SAFE ZONE STATUS */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#16a34a]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Safe Zone Status</p>
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-0.5">All Clear</h3>
            <p className="text-[11px] text-slate-400 font-medium">No major threats</p>
          </div>
        </div>

        {/* RESPONSE TIME */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Response Time (Avg)</p>
            <div className="flex items-end gap-2 mb-0.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">12.4 min</h3>
              <span className="text-[11px] font-bold text-[#16a34a] flex items-center">
                <svg className="w-3 h-3 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                1.8 min
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">vs yesterday</p>
          </div>
        </div>
      </div>

      {/* Top Destinations Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-[#ef4444]" strokeWidth={2.5} />
            Top Destinations in Prayagraj
          </h2>
          <button className="text-[12px] font-bold text-[#ef4444] hover:text-[#dc2626] transition flex items-center gap-1 cursor-pointer">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOP_DESTINATIONS.map((place) => (
            <div 
              key={place.id} 
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-slate-200/50"
            >
              <img 
                src={place.image}
                alt={place.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
              
              <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between">
                <div>
                  <h3 className="text-white font-bold text-[13px] uppercase tracking-wide mb-1">{place.name}</h3>
                  <p className="text-slate-300 text-[10px] font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {place.location}
                  </p>
                </div>
                <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] font-bold tracking-wider border border-white/10">
                  {place.distance}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Tactical Map Section */}
      <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Panel: Active Units */}
        <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">
          <div className="p-5 border-b border-slate-50">
            <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-1">
              <Crosshair className="w-4 h-4 text-slate-900" />
              Live Tactical Map
            </h2>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-slate-400 font-medium">Real-time overview</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-green-700 uppercase tracking-widest">Live</span>
              </div>
            </div>
          </div>
          
          <div className="p-5 flex-1">
            <p className="text-[11px] font-bold text-slate-900 mb-4">Active Units</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700">Police Units</span>
                </div>
                <span className="text-[13px] font-bold text-slate-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700">Medical Teams</span>
                </div>
                <span className="text-[13px] font-bold text-slate-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700">Response Vehicles</span>
                </div>
                <span className="text-[13px] font-bold text-slate-900">08</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700">CCTV Cameras</span>
                </div>
                <span className="text-[13px] font-bold text-slate-900">45</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: The Leaflet Map */}
        <div className="flex-1 h-[400px] lg:h-auto relative bg-slate-100">
          <MapComponent
            currentLocation={location}
            riskZones={riskZones}
            className="w-full h-full absolute inset-0 z-0"
          />
        </div>
      </div>

    </div>
  );
}
