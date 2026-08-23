import React, { useEffect, useMemo, useState } from 'react';
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { Building2, Flame, Hospital, MapPin } from 'lucide-react';

const libraries = [];
const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 25.4358, lng: 81.8463 };

const categories = {
  police: { label: 'Police', color: '#2563eb', icon: Building2 },
  fire: { label: 'Fire', color: '#dc2626', icon: Flame },
  hospital: { label: 'Hospital', color: '#16a34a', icon: Hospital },
};

const normalize = (items, type) =>
  (items || [])
    .filter((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))
    .map((item) => ({
      ...item,
      type,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
    }));

export function AuthorityJurisdictionMap({ jurisdiction, services }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [selected, setSelected] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'authority-jurisdiction-map',
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  const markers = useMemo(
    () => [
      ...normalize(services?.policeStations, 'police'),
      ...normalize(services?.fireStations, 'fire'),
      ...normalize(services?.hospitals, 'hospital'),
    ],
    [services],
  );

  const center = markers.length
    ? { lat: markers[0].latitude, lng: markers[0].longitude }
    : defaultCenter;

  useEffect(() => setSelected(null), [jurisdiction]);

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[340px] items-center justify-center bg-slate-50 px-6 text-center">
        <div>
          <MapPin className="mx-auto h-6 w-6 text-slate-300" />
          <p className="mt-2 text-[11px] font-bold text-slate-600">Map key not configured</p>
          <p className="mt-1 text-[10px] text-slate-400">Add VITE_GOOGLE_MAPS_API_KEY to render the jurisdiction map.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return <div className="flex min-h-[340px] items-center justify-center text-[11px] text-red-600">Unable to load Google Maps.</div>;
  }

  if (!isLoaded) {
    return <div className="min-h-[340px] animate-pulse bg-slate-100" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        clickableIcons: false,
      }}
    >
      {markers.map((marker) => {
        const category = categories[marker.type];
        return (
          <MarkerF
            key={`${marker.type}-${marker.id}`}
            position={{ lat: marker.latitude, lng: marker.longitude }}
            onClick={() => setSelected(marker)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: category.color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        );
      })}

      {selected && (
        <InfoWindowF
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={() => setSelected(null)}
        >
          <div className="max-w-[230px] pr-2 font-sans">
            <p className="text-[12px] font-black text-slate-900">{selected.name}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">{selected.address || jurisdiction}</p>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
