import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Autocomplete, CircleF, GoogleMap, MarkerF, PolygonF, useJsApiLoader } from '@react-google-maps/api';
import { useSelector } from 'react-redux';
import {
  CheckCircle2,
  Loader2,
  Map,
  MapPin,
  Navigation,
  Plus,
  Search,
  ServerCrash,
  ShieldAlert,
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

const GOOGLE_MAP_LIBRARIES = ['places'];
const DEFAULT_CENTER = { lat: 25.4358, lng: 81.8463 };
const DANGER_RADIUS_M = 500;
const mapContainerStyle = { width: '100%', height: '100%' };

const unwrap = (value) => value?.data?.data ?? value?.data ?? value;

const polygonPaths = (zone) => (zone.polygon || []).map((point) => ({
  lat: point.latitude ?? point.lat,
  lng: point.longitude ?? point.lng,
}));

export function AuthorityRiskZonesPage() {
  const { user } = useSelector((state) => state.auth);
  const isSystemAdmin = user?.role === 'SYSTEM_ADMIN';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [zoneName, setZoneName] = useState('');

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authorityService.getRiskZones();
      const data = unwrap(response);
      setZones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load risk zones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const mapCenter = useMemo(() => {
    if (selectedPlace) return { lat: selectedPlace.lat, lng: selectedPlace.lng };
    const firstCircle = zones.find((zone) => zone.geometryType === 'CIRCLE' && zone.latitude != null && zone.longitude != null);
    return firstCircle ? { lat: firstCircle.latitude, lng: firstCircle.longitude } : DEFAULT_CENTER;
  }, [selectedPlace, zones]);

  const handlePlaceChanged = () => {
    const place = autocomplete?.getPlace?.();
    const location = place?.geometry?.location;
    if (!location) {
      setError('Choose a place from the Google Places suggestions.');
      return;
    }

    const name = place.name || place.formatted_address || 'Danger zone';
    setSelectedPlace({
      lat: location.lat(),
      lng: location.lng(),
      name,
      address: place.formatted_address || '',
    });
    setZoneName(name);
    setError('');
    setSuccess('');
  };

  const createDangerZone = async () => {
    if (!selectedPlace) {
      setError('Select a place before creating the danger geofence.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await authorityService.createRiskZone({
        name: zoneName.trim() || selectedPlace.name,
        description: selectedPlace.address || `System-admin danger geofence around ${selectedPlace.name}`,
        type: 'RISK',
        severity: 'HIGH',
        geometryType: 'CIRCLE',
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lng,
        radiusM: DANGER_RADIUS_M,
      });
      setSuccess('Danger zone created with a 500 m radius.');
      setSelectedPlace(null);
      setZoneName('');
      await fetchZones();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create danger zone');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleZone = async (zone) => {
    if (!isSystemAdmin) return;
    try {
      setError('');
      if (zone.active) await authorityService.deactivateRiskZone(zone.id);
      else await authorityService.activateRiskZone(zone.id);
      await fetchZones();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to change zone status');
    }
  };

  return (
    <div className="font-sans max-w-[1200px] mx-auto pb-8 sm:pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5 sm:mb-8">
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" /> Danger Geofences
          </h1>
          <p className="text-[11px] sm:text-[13px] text-slate-500 font-medium mt-1">
            System admins can select a real place and create a 500 m danger radius that appears on tourist Radar maps.
          </p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[11px] sm:text-xs font-semibold text-red-700">{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] sm:text-xs font-semibold text-emerald-700">{success}</div>}

      {isSystemAdmin && (
        <div className="mb-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="grid lg:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Select place</label>
              {isLoaded ? (
                <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChanged}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search a building, landmark or area"
                      className="w-full h-10 sm:h-11 pl-9 pr-3 border border-slate-200 rounded-lg text-[11px] sm:text-xs font-semibold outline-none focus:border-indigo-400"
                    />
                  </div>
                </Autocomplete>
              ) : (
                <div className="h-10 sm:h-11 rounded-lg bg-slate-100 animate-pulse" />
              )}
            </div>

            <div>
              <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Zone name</label>
              <input
                value={zoneName}
                onChange={(event) => setZoneName(event.target.value)}
                placeholder="Danger zone name"
                className="w-full h-10 sm:h-11 px-3 border border-slate-200 rounded-lg text-[11px] sm:text-xs font-semibold outline-none focus:border-indigo-400"
              />
            </div>

            <button
              onClick={createDangerZone}
              disabled={!selectedPlace || saving}
              className="h-10 sm:h-11 px-4 bg-red-600 text-white rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create 500 m Zone
            </button>
          </div>

          {selectedPlace && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100 text-[10px] sm:text-[11px] text-slate-600">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
              <span><strong>{selectedPlace.name}</strong>{selectedPlace.address ? ` · ${selectedPlace.address}` : ''}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-slate-100 rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[430px] sm:h-[500px] relative">
            {loadError ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-red-600">Google Maps failed to load.</div>
            ) : !isLoaded ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={selectedPlace ? 15 : 12}
                options={{
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                  gestureHandling: 'cooperative',
                }}
              >
                {selectedPlace && (
                  <>
                    <MarkerF position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }} title={selectedPlace.name} />
                    <CircleF
                      center={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                      radius={DANGER_RADIUS_M}
                      options={{ fillColor: '#ef4444', fillOpacity: 0.2, strokeColor: '#ef4444', strokeWeight: 2 }}
                    />
                  </>
                )}

                {zones.filter((zone) => zone.active !== false).map((zone) => {
                  if (zone.geometryType === 'POLYGON' && Array.isArray(zone.polygon)) {
                    return <PolygonF key={zone.id} paths={polygonPaths(zone)} options={{ fillColor: '#ef4444', fillOpacity: 0.2, strokeColor: '#ef4444', strokeWeight: 2 }} />;
                  }
                  if (zone.geometryType === 'CIRCLE' && zone.latitude != null && zone.longitude != null && zone.radiusM) {
                    return (
                      <CircleF
                        key={zone.id}
                        center={{ lat: zone.latitude, lng: zone.longitude }}
                        radius={zone.radiusM}
                        options={{ fillColor: zone.type === 'RISK' ? '#ef4444' : '#22c55e', fillOpacity: 0.18, strokeColor: zone.type === 'RISK' ? '#ef4444' : '#22c55e', strokeWeight: 2 }}
                      />
                    );
                  }
                  return null;
                })}
              </GoogleMap>
            )}

            <div className="absolute left-3 bottom-3 z-10 px-3 py-2 rounded-lg bg-white/95 border border-slate-200 shadow text-[9px] sm:text-[10px] font-semibold text-slate-600">
              Use two fingers to move the map on mobile.
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[430px] sm:h-[500px]">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-[10px] sm:text-[12px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" /> Danger Zones
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300 mb-3" />
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500">Loading zones...</p>
              </div>
            ) : error && zones.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
                <p className="text-red-700 font-bold text-xs">Unable to load zones</p>
              </div>
            ) : zones.length === 0 ? (
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-10">No zones defined</p>
            ) : (
              zones.map((zone) => (
                <div key={zone.id} className="p-3 sm:p-4 rounded-lg border border-slate-200 bg-white">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-snug">{zone.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-widest border ${
                      zone.active ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {zone.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-slate-400" />
                    {zone.geometryType === 'CIRCLE' ? `Radius: ${zone.radiusM || 0} m` : 'Polygon geofence'}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{zone.type} · {zone.severity}</p>

                  {isSystemAdmin && (
                    <button
                      onClick={() => handleToggleZone(zone)}
                      className={`mt-3 w-full py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                        zone.active
                          ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {zone.active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
