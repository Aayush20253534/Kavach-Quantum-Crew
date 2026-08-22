import React from 'react';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { useGeolocation } from '../../tracking/hooks/useGeolocation';
import { useRiskZones, useLatestLocations } from '../../tracking/api/trackingQueries';
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
  Crosshair,
  Compass
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

  // Tracking Logic
  const { data: currentTrip } = useCurrentTrip();
  const isActive = currentTrip?.status === 'ACTIVE';
  const { location } = useGeolocation(currentTrip?.id, isActive);
  const { data: riskZonesData } = useRiskZones();
  const riskZones = riskZonesData?.items || riskZonesData || [];

  return (
    <div className="space-y-5 font-sans max-w-[1200px] mx-auto pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-wide">Live City Analytics</h2>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Today <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* TOTAL TOURISTS */}
        <Link to="/tourist/groups/create" className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 flex flex-col gap-1.5 relative overflow-hidden group hover:border-[#8b5cf6] transition-colors cursor-pointer block">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-14 h-14 text-[#8b5cf6]" />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Tourists</p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">1,24,580</h3>
          </div>
          <p className="text-[10px] font-bold text-[#16a34a] flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
            12.5% vs yesterday
          </p>
        </Link>

        {/* ACTIVE ALERTS */}
        <Link to="/tourist/incidents/history" className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 flex flex-col gap-1.5 relative overflow-hidden group hover:border-[#e11d48] transition-colors cursor-pointer block">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <Bell className="w-14 h-14 text-[#e11d48]" />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Alerts</p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-[24px] font-black text-[#e11d48] tracking-tight leading-none">07</h3>
          </div>
          <p className="text-[10px] font-bold text-[#e11d48] flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            2 vs yesterday
          </p>
        </Link>

        {/* SAFE ZONE STATUS */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 flex flex-col gap-1.5 relative overflow-hidden group hover:border-[#16a34a] transition-colors">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-14 h-14 text-[#16a34a]" />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Safe Zone Status</p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-[20px] font-black text-slate-900 tracking-tight leading-tight">All Clear</h3>
          </div>
          <p className="text-[10px] font-bold text-slate-500">No major threats</p>
        </div>

        {/* RESPONSE TIME */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 flex flex-col gap-1.5 relative overflow-hidden group hover:border-[#0ea5e9] transition-colors">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-14 h-14 text-[#0ea5e9]" />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Response Time (Avg)</p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">12.4m</h3>
          </div>
          <p className="text-[10px] font-bold text-[#16a34a] flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            1.8m vs yesterday
          </p>
        </div>
      </div>

      {/* Top Destinations Section */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#e11d48]" strokeWidth={2.5} />
            Top Destinations
          </h2>
          <Link to="/tourist/trips/create" className="text-[11px] font-bold text-[#e11d48] hover:text-[#be123c] transition-colors flex items-center gap-1 cursor-pointer">
            Plan a Trip <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOP_DESTINATIONS.map((place) => (
            <div
              key={place.id}
              className="group relative h-36 rounded-lg overflow-hidden cursor-pointer shadow-sm border border-slate-200"
            >
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-slate-700" />
              </div>
              <img
                src={place.image}
                alt={place.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90" />

              <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between">
                <div>
                  <h3 className="text-white font-black text-[11px] uppercase tracking-wide mb-0.5">{place.name}</h3>
                  <p className="text-slate-300 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {place.location}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[9px] font-bold tracking-wider border border-white/20">
                  {place.distance}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Tactical Map Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row">

        {/* Left Panel: Active Units */}
        <div className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-slate-400" />
              Tactical Map
            </h2>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time stats</p>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#f0fdf4] border border-[#dcfce7] rounded shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></div>
                <span className="text-[8px] font-bold text-[#16a34a] uppercase tracking-widest">Live</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Responder Units</p>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-[#e0f2fe] bg-[#f0f9ff] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded bg-[#0ea5e9]"></div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Police Units</span>
                </div>
                <span className="text-[12px] font-black text-slate-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-[#dcfce7] bg-[#f0fdf4] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded bg-[#16a34a]"></div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Medical Teams</span>
                </div>
                <span className="text-[12px] font-black text-slate-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-[#ffe4e6] bg-[#fff1f2] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded bg-[#e11d48]"></div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Response PCR</span>
                </div>
                <span className="text-[12px] font-black text-slate-900">08</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded border border-[#fae8ff] bg-[#fdf4ff] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded bg-[#d946ef]"></div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">CCTV Coverage</span>
                </div>
                <span className="text-[12px] font-black text-slate-900">45</span>
              </div>
            </div>

            <Link to="/tourist/tracking" className="block mt-6">
              <button className="w-full py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors">
                Open Full Map
              </button>
            </Link>
          </div>
        </div>

        {/* Right Panel: The Leaflet Map */}
        <div className="flex-1 h-[350px] lg:h-auto relative bg-slate-200">
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
