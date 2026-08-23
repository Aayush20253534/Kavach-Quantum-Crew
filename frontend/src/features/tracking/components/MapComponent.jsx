import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleF, GoogleMap, InfoWindowF, MarkerF, PolygonF, useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAP_LIBRARIES = ['places'];
const containerStyle = { width: '100%', height: '100%', borderRadius: '0.5rem' };
const EMERGENCY_SEARCH_RADIUS_METERS = 5000;

const SERVICE_TYPES = [
  { type: 'police', label: 'Police', marker: 'P', color: '#2563eb' },
  { type: 'hospital', label: 'Hospital', marker: 'H', color: '#16a34a' },
  { type: 'fire_station', label: 'Fire Station', marker: 'F', color: '#dc2626' },
];

export function MapComponent({
  currentLocation,
  groupLocations = [],
  riskZones = [],
  showEmergencyServicesOnly = false,
  onEmergencyCountsChange,
  onLocationLabelChange,
  className = 'h-96 w-full rounded-lg shadow-md',
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [emergencyPlaces, setEmergencyPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const hasPositionedCamera = useRef(false);
  const [cameraCenter, setCameraCenter] = useState({ lat: 25.4358, lng: 81.8463 });

  const center = useMemo(
    () => currentLocation
      ? { lat: currentLocation.lat, lng: currentLocation.lng }
      : { lat: 25.4358, lng: 81.8463 },
    [currentLocation],
  );

  const onLoad = useCallback((mapInstance) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);
  const emergencyMarkerIcon = useCallback((place) => {
    if (!window.google?.maps) return undefined;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 16,
      fillColor: place.color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeOpacity: 1,
      strokeWeight: 2,
    };
  }, []);


  useEffect(() => {
    if (!map || !currentLocation || hasPositionedCamera.current) return;

    // Position the camera once. After that, GPS updates move only the live marker.
    // This prevents background location/query rerenders from stealing manual zoom/pan.
    hasPositionedCamera.current = true;
    setCameraCenter(center);

    if (showEmergencyServicesOnly && window.google?.maps) {
      const searchCircle = new window.google.maps.Circle({
        center,
        radius: EMERGENCY_SEARCH_RADIUS_METERS,
      });
      const bounds = searchCircle.getBounds();
      if (bounds) {
        map.fitBounds(bounds, 24);
        return;
      }
    }

    map.panTo(center);
  }, [center, currentLocation, map, showEmergencyServicesOnly]);

  useEffect(() => {
    if (!currentLocation || !window.google?.maps?.Geocoder || !onLocationLabelChange) return undefined;

    let cancelled = false;
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      {
        location: {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        },
      },
      (results, status) => {
        if (cancelled) return;

        if (status !== 'OK' || !results?.length) {
          onLocationLabelChange('Current location');
          return;
        }

        const components = results[0]?.address_components || [];
        const findComponent = (...types) =>
          components.find((component) =>
            types.some((type) => component.types.includes(type)),
          )?.long_name;

        const area = findComponent(
          'sublocality_level_1',
          'sublocality',
          'neighborhood',
        );
        const city = findComponent('locality', 'administrative_area_level_2');

        if (area && city && area !== city) {
          onLocationLabelChange(`${area}, ${city}`);
          return;
        }

        onLocationLabelChange(city || area || results[0]?.formatted_address || 'Current location');
      },
    );

    return () => {
      cancelled = true;
    };
  }, [currentLocation?.lat, currentLocation?.lng, onLocationLabelChange]);

  useEffect(() => {
    if (!showEmergencyServicesOnly || !map || !currentLocation || !window.google?.maps?.places) {
      setEmergencyPlaces([]);
      return undefined;
    }

    let cancelled = false;
    const service = new window.google.maps.places.PlacesService(map);
    const collected = [];
    const counts = {
      police: 0,
      hospital: 0,
      fire_station: 0,
    };
    let completed = 0;

    SERVICE_TYPES.forEach((serviceType) => {
      service.nearbySearch(
        {
          location: { lat: currentLocation.lat, lng: currentLocation.lng },
          radius: EMERGENCY_SEARCH_RADIUS_METERS,
          type: serviceType.type,
        },
        (results, status) => {
          completed += 1;
          if (!cancelled && status === window.google.maps.places.PlacesServiceStatus.OK) {
            counts[serviceType.type] = results.length;
            results.forEach((place) => {
              const location = place.geometry?.location;
              if (!location) return;
              collected.push({
                id: `${serviceType.type}:${place.place_id}`,
                placeId: place.place_id,
                name: place.name,
                type: serviceType.type,
                typeLabel: serviceType.label,
                marker: serviceType.marker,
                color: serviceType.color,
                lat: location.lat(),
                lng: location.lng(),
                vicinity: place.vicinity,
              });
            });
          }
          if (!cancelled && completed === SERVICE_TYPES.length) {
            setEmergencyPlaces(collected);
            onEmergencyCountsChange?.({
              police: counts.police,
              hospitals: counts.hospital,
              fireStations: counts.fire_station,
              total: counts.police + counts.hospital + counts.fire_station,
            });
          }
        },
      );
    });

    return () => { cancelled = true; };
  }, [showEmergencyServicesOnly, map, currentLocation?.lat, currentLocation?.lng, onEmergencyCountsChange]);

  if (loadError) {
    return (
      <div className={`bg-slate-100 flex flex-col items-center justify-center border border-slate-200 text-slate-500 font-bold ${className}`}>
        <p className="text-red-500 mb-2">Error loading Google Maps</p>
        <p className="text-[10px] uppercase">Check VITE_GOOGLE_MAPS_API_KEY and enable Maps JavaScript + Places APIs</p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={`bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-[11px] animate-pulse ${className}`}>Initializing live map...</div>;
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={cameraCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          scrollwheel: true,
          draggable: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {currentLocation && (
          <>
            <MarkerF position={center} title="Your live location" />
            {showEmergencyServicesOnly && (
              <CircleF
                center={center}
                radius={EMERGENCY_SEARCH_RADIUS_METERS}
                options={{
                  fillOpacity: 0.03,
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  clickable: false,
                }}
              />
            )}
          </>
        )}

        {showEmergencyServicesOnly ? (
          emergencyPlaces.map((place) => (
            <MarkerF
              key={place.id}
              position={{ lat: place.lat, lng: place.lng }}
              icon={emergencyMarkerIcon(place)}
              label={{
                text: place.marker,
                color: 'white',
                fontWeight: '800',
                fontSize: '11px',
              }}
              title={`${place.typeLabel}: ${place.name}`}
              onClick={() => setSelectedPlace(place)}
            />
          ))
        ) : (
          <>
            {groupLocations.map((loc) => (
              <MarkerF
                key={loc.userId || loc.id}
                position={{ lat: loc.lat, lng: loc.lng }}
                label={{ text: loc.userName?.[0] || 'G', color: 'white', fontWeight: 'bold' }}
              />
            ))}
            {riskZones.map((zone) => {
              const isDanger = zone.severity === 'CRITICAL' || zone.severity === 'HIGH';
              const color = isDanger ? '#ef4444' : zone.severity === 'LOW' ? '#22c55e' : '#f97316';
              if (zone.type === 'POLYGON' && zone.coordinates) {
                const paths = zone.coordinates.map((coord) => Array.isArray(coord) ? { lat: coord[0], lng: coord[1] } : coord);
                return <PolygonF key={zone.id} paths={paths} options={{ fillColor: color, fillOpacity: 0.35, strokeColor: color, strokeWeight: 2 }} />;
              }
              if (zone.type === 'CIRCLE') {
                return <CircleF key={zone.id} center={{ lat: zone.center.lat, lng: zone.center.lng }} radius={zone.radius} options={{ fillColor: color, fillOpacity: 0.35, strokeColor: color, strokeWeight: 2 }} />;
              }
              return null;
            })}
          </>
        )}

        {selectedPlace && (
          <InfoWindowF position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }} onCloseClick={() => setSelectedPlace(null)}>
            <div className="max-w-56">
              <strong>{selectedPlace.name}</strong>
              <div>{selectedPlace.typeLabel}</div>
              {selectedPlace.vicinity && <small>{selectedPlace.vicinity}</small>}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
