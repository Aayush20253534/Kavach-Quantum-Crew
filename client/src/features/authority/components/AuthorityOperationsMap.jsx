import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const GOOGLE_MAP_LIBRARIES = ['places'];
const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 25.4358, lng: 81.8463 };

const incidentColor = (severity) => {
  switch (String(severity || '').toUpperCase()) {
    case 'CRITICAL': return '#dc2626';
    case 'HIGH': return '#f97316';
    case 'MEDIUM': return '#d97706';
    default: return '#2563eb';
  }
};

const unitColor = (type) => {
  switch (String(type || '').toUpperCase()) {
    case 'POLICE': return '#2563eb';
    case 'FIRE': return '#dc2626';
    case 'AMBULANCE': return '#16a34a';
    default: return '#475569';
  }
};

const finitePoint = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

export function AuthorityOperationsMap({ incidents = [], units = [] }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const markers = useMemo(() => {
    const incidentMarkers = incidents
      .map((incident) => {
        const point = finitePoint(incident.latitude ?? incident.location?.latitude, incident.longitude ?? incident.location?.longitude);
        return point ? { kind: 'incident', id: incident.id, point, data: incident } : null;
      })
      .filter(Boolean);

    const unitMarkers = units
      .map((unit) => {
        const point = finitePoint(unit.latitude, unit.longitude);
        return point ? { kind: 'unit', id: unit.id, point, data: unit } : null;
      })
      .filter(Boolean);

    return [...incidentMarkers, ...unitMarkers];
  }, [incidents, units]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || markers.length === 0 || !window.google?.maps) return;
    if (markers.length === 1) {
      mapRef.current.panTo(markers[0].point);
      mapRef.current.setZoom(14);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    markers.forEach((marker) => bounds.extend(marker.point));
    mapRef.current.fitBounds(bounds, 64);
  }, [isLoaded, markers]);

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-slate-50 px-6 text-center">
        <div>
          <MapPin className="mx-auto h-6 w-6 text-slate-300" />
          <p className="mt-2 text-[11px] font-bold text-slate-600">Map key not configured</p>
          <p className="mt-1 text-[10px] text-slate-400">Add VITE_GOOGLE_MAPS_API_KEY to the client environment.</p>
        </div>
      </div>
    );
  }

  if (loadError) return <div className="flex min-h-[420px] items-center justify-center text-sm font-semibold text-red-600">Unable to load Google Maps.</div>;
  if (!isLoaded) return <div className="min-h-[420px] animate-pulse bg-slate-100" />;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markers[0]?.point || defaultCenter}
      zoom={markers.length ? 12 : 6}
      onLoad={(map) => { mapRef.current = map; }}
      onUnmount={() => { mapRef.current = null; }}
      options={{ fullscreenControl: true, streetViewControl: false, mapTypeControl: true, clickableIcons: false }}
    >
      {markers.map((marker) => {
        const isIncident = marker.kind === 'incident';
        const color = isIncident ? incidentColor(marker.data.severity || marker.data.priority) : unitColor(marker.data.type);
        return (
          <MarkerF
            key={`${marker.kind}-${marker.id}`}
            position={marker.point}
            onClick={() => setSelected(marker)}
            icon={{
              path: isIncident ? window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW : window.google.maps.SymbolPath.CIRCLE,
              scale: isIncident ? 6 : 8,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        );
      })}

      {selected && (
        <InfoWindowF position={selected.point} onCloseClick={() => setSelected(null)}>
          <div className="max-w-[260px] pr-2 font-sans">
            {selected.kind === 'incident' ? (
              <>
                <p className="text-[11px] font-black uppercase tracking-wide text-red-600">Incident</p>
                <p className="mt-1 text-[13px] font-black text-slate-900">{selected.data.title || selected.data.type || 'Emergency Incident'}</p>
                <p className="mt-1 text-[11px] text-slate-600">{selected.data.description || 'No description provided.'}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">{selected.data.status} · {selected.data.severity || selected.data.priority}</p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{selected.data.type} Fleet</p>
                <p className="mt-1 text-[13px] font-black text-slate-900">{selected.data.name}</p>
                <p className="mt-1 text-[11px] text-slate-600">{selected.data.organization || selected.data.jurisdiction || 'Emergency unit'}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">Status: {selected.data.status}</p>
              </>
            )}
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
