import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BatteryMedium, Loader2, Navigation, ShieldCheck, Users, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

import { groupService } from '../../groups/api/groupService';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { trackingService } from '../api/trackingService';
import { MapComponent } from '../components/MapComponent';
import { useGeolocation } from '../hooks/useGeolocation';

const metersBetween = (a, b) => {
  const R = 6371000;
  const toRad = (v) => v * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export function LiveTrackingPage() {
  const { data: trip, isLoading } = useCurrentTrip();
  const isActive = trip?.status === 'ACTIVE';
  const { location, isTracking, permission, error: geoError } = useGeolocation(trip?.id, isActive);

  const [zones, setZones] = useState([]);
  const [group, setGroup] = useState(null);
  const [memberLocations, setMemberLocations] = useState([]);
  const [battery, setBattery] = useState(null);

  useEffect(() => {
    trackingService.getRiskZones().then((data) => setZones(data?.items || data || [])).catch(() => setZones([]));
  }, []);

  useEffect(() => {
    if (!trip || trip.tripType !== 'GROUP') return;
    groupService.getGroupForTrip(trip.id)
      .then((g) => {
        setGroup(g);
        return trackingService.getLatestLocations(g.id);
      })
      .then((data) => setMemberLocations(data?.items || data || []))
      .catch(() => {});
  }, [trip?.id, trip?.tripType]);

  useEffect(() => {
    let batteryManager;
    if (navigator.getBattery) {
      navigator.getBattery().then((value) => {
        batteryManager = value;
        const update = () => setBattery(Math.round(value.level * 100));
        update();
        value.addEventListener('levelchange', update);
      }).catch(() => {});
    }
    return () => batteryManager?.removeEventListener?.('levelchange', () => {});
  }, []);

  const currentZone = useMemo(() => {
    if (!location) return null;
    const point = { lat: location.lat, lng: location.lng };
    return zones.find((zone) => {
      if (zone.geometryType !== 'CIRCLE' || zone.latitude == null || zone.longitude == null || !zone.radiusM) return false;
      return metersBetween(point, { lat: zone.latitude, lng: zone.longitude }) <= zone.radiusM;
    }) || null;
  }, [zones, location]);

  if (isLoading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin" /></div>;

  if (!trip) {
    return <div className="max-w-xl mx-auto py-16 text-center bg-white border rounded-2xl"><h2 className="font-black text-xl">No current trip</h2><p className="text-sm text-slate-500 mt-2">Create a trip before using live trip tracking.</p><Link to="/tourist/trips/create" className="inline-block mt-5 px-5 py-3 bg-rose-600 text-white rounded-lg text-xs font-black">Create Trip</Link></div>;
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="grid sm:grid-cols-4 gap-3">
        <Metric label="Tracking" value={isTracking && isActive ? 'Active' : isActive ? 'Waiting GPS' : 'Trip not started'} icon={Navigation} />
        <Metric label="Current zone" value={currentZone ? `${currentZone.name} (${currentZone.type})` : 'Outside configured risk zones'} icon={ShieldCheck} />
        <Metric label="Group online" value={trip.tripType === 'GROUP' ? `${memberLocations.length}/${group?.members?.length || 0}` : 'Solo trip'} icon={Users} />
        <Metric label="Battery" value={battery == null ? 'Unavailable' : `${battery}%`} icon={BatteryMedium} />
      </div>

      {(geoError || permission === 'denied') && <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">{geoError || 'Location permission denied'}</div>}

      <div className="h-[calc(100vh-260px)] min-h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <MapComponent currentLocation={location} riskZones={zones} className="w-full h-full" />
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return <div className="bg-white border border-slate-200 rounded-xl p-4"><Icon className="w-4 h-4 text-slate-400" /><p className="text-[10px] uppercase tracking-wider font-black text-slate-400 mt-2">{label}</p><p className="text-sm font-bold mt-1">{value}</p></div>;
}
