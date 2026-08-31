import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleF, GoogleMap, InfoWindowF, MarkerF, PolygonF, useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { FleetResponseOverlay } from './FleetResponseOverlay';

const GOOGLE_MAP_LIBRARIES = ['places'];
const containerStyle = { width: '100%', height: '100%', borderRadius: '0.5rem' };
const EMERGENCY_SEARCH_RADIUS_METERS = 5000;

const SERVICE_TYPES = [
  { type: 'police', label: 'Police Station', marker: 'P', color: '#2563eb' },
  { type: 'hospital', label: 'Hospital', marker: 'H', color: '#16a34a' },
  { type: 'fire_station', label: 'Fire Station', marker: 'F', color: '#dc2626' },
];

export function MapComponent({
  currentLocation,
  currentMarkerColor = '#2563eb',
  currentMarkerTitle = 'Your live location',
  groupLocations = [],
  groupCentroid = null,
  fleetResponses = [],
  groupGeofenceRadiusM = 0,
  riskZones = [],
  showEmergencyServicesOnly = false,
  mapGestureHandling = 'greedy',
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
  const [cameraCenter, setCameraCenter] = useState(() => currentLocation
    ? { lat: currentLocation.lat, lng: currentLocation.lng }
    : { lat: 25.4358, lng: 81.8463 });

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

  const participantMarkerIcon = useCallback((color, stale = false) => {
    if (!window.google?.maps) return undefined;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 11,
      fillColor: color || '#2563eb',
      fillOpacity: stale ? 0.45 : 1,
      strokeColor: '#ffffff',
      strokeOpacity: 1,
      strokeWeight: 2.5,
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
    map.setZoom(16);
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

        const result = results[0];
        const stateName = result?.address_components?.find((component) =>
          component.types?.includes('administrative_area_level_1'),
        )?.long_name;
        const formattedAddress = result?.formatted_address || 'Current location';
        const addressBeforeState = stateName
          ? formattedAddress.split(`, ${stateName}`)[0].trim()
          : formattedAddress;

        onLocationLabelChange(addressBeforeState || 'Current location');
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
          gestureHandling: mapGestureHandling,
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
            <MarkerF
              position={center}
              title={currentMarkerTitle}
              icon={participantMarkerIcon(currentMarkerColor, false)}
              zIndex={1200}
            />
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
            {!showEmergencyServicesOnly && groupGeofenceRadiusM > 0 && (
              <>
                {/* Layered low-opacity circles soften the group geofence edge instead
                    of drawing one harsh boundary line. */}
                <CircleF
                  center={groupCentroid || center}
                  radius={groupGeofenceRadiusM + 35}
                  options={{
                    fillColor: '#2563eb',
                    fillOpacity: 0.012,
                    strokeOpacity: 0,
                    clickable: false,
                    zIndex: 1,
                  }}
                />
                <CircleF
                  center={groupCentroid || center}
                  radius={groupGeofenceRadiusM}
                  options={{
                    fillColor: '#2563eb',
                    fillOpacity: 0.045,
                    strokeColor: '#2563eb',
                    strokeOpacity: 0.22,
                    strokeWeight: 1,
                    clickable: false,
                    zIndex: 2,
                  }}
                />
                <CircleF
                  center={groupCentroid || center}
                  radius={Math.max(0, groupGeofenceRadiusM - 28)}
                  options={{
                    fillColor: '#2563eb',
                    fillOpacity: 0.018,
                    strokeOpacity: 0,
                    clickable: false,
                    zIndex: 1,
                  }}
                />
              </>
            )}
          </>
        )}

        {!showEmergencyServicesOnly && fleetResponses.length > 0 && (
          <FleetResponseOverlay responses={fleetResponses} />
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
            {groupCentroid && groupGeofenceRadiusM > 0 && (
              <MarkerF position={groupCentroid} icon={participantMarkerIcon('#000000', false)} label={{ text: 'C', color: 'white', fontWeight: '900', fontSize: '10px' }} title="Dynamic majority-group centroid" zIndex={1200} />
            )}
            {groupLocations.map((loc) => (
              <MarkerF
                key={loc.userId || loc.id}
                position={{ lat: loc.lat, lng: loc.lng }}
                icon={participantMarkerIcon(loc.color, loc.stale)}
                label={{ text: loc.userName?.[0]?.toUpperCase() || 'G', color: 'white', fontWeight: '800', fontSize: '10px' }}
                title={`${loc.userName || 'Group member'} · ${loc.role === 'LEADER' ? 'Leader · ' : ''}${loc.stale ? 'Offline / last known location' : 'Active'}`}
                zIndex={loc.role === 'LEADER' ? 1190 : 1180}
              />
            ))}
            {riskZones.map((zone) => {
              if (zone.active === false) return null;

              const isDanger = zone.type === 'RISK' || zone.severity === 'CRITICAL' || zone.severity === 'HIGH';
              const color = isDanger ? '#ef4444' : zone.type === 'SAFE' || zone.severity === 'LOW' ? '#22c55e' : '#f97316';
              const geometryType = zone.geometryType || zone.type;

              if (geometryType === 'POLYGON' && Array.isArray(zone.polygon || zone.coordinates)) {
                const coordinates = zone.polygon || zone.coordinates;
                const paths = coordinates.map((coord) => {
                  if (Array.isArray(coord)) return { lat: coord[0], lng: coord[1] };
                  return { lat: coord.latitude ?? coord.lat, lng: coord.longitude ?? coord.lng };
                });
                if (isDanger) {
                  return (
                    <React.Fragment key={zone.id}>
                      <PolygonF
                        paths={paths}
                        options={{
                          fillColor: color,
                          fillOpacity: 0.10,
                          strokeColor: color,
                          strokeOpacity: 0.10,
                          strokeWeight: 7,
                          clickable: false,
                          zIndex: 29,
                        }}
                      />
                      <PolygonF
                        paths={paths}
                        options={{
                          fillColor: color,
                          fillOpacity: 0.24,
                          strokeColor: color,
                          strokeOpacity: 0.34,
                          strokeWeight: 1,
                          clickable: false,
                          zIndex: 30,
                        }}
                      />
                    </React.Fragment>
                  );
                }

                return <PolygonF key={zone.id} paths={paths} options={{
                  fillColor: color,
                  fillOpacity: 0.22,
                  strokeColor: color,
                  strokeOpacity: 0.55,
                  strokeWeight: 1,
                  zIndex: 10,
                }} />;
              }

              const latitude = zone.latitude ?? zone.center?.lat;
              const longitude = zone.longitude ?? zone.center?.lng;
              const radius = zone.radiusM ?? zone.radius;
              if (geometryType === 'CIRCLE' && Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(radius)) {
                if (isDanger) {
                  return (
                    <React.Fragment key={zone.id}>
                      <CircleF
                        center={{ lat: latitude, lng: longitude }}
                        radius={radius + 32}
                        options={{
                          fillColor: color,
                          fillOpacity: 0.035,
                          strokeOpacity: 0,
                          clickable: false,
                          zIndex: 28,
                        }}
                      />
                      <CircleF
                        center={{ lat: latitude, lng: longitude }}
                        radius={radius}
                        options={{
                          fillColor: color,
                          fillOpacity: 0.20,
                          strokeColor: color,
                          strokeOpacity: 0.32,
                          strokeWeight: 1,
                          clickable: false,
                          zIndex: 30,
                        }}
                      />
                      <CircleF
                        center={{ lat: latitude, lng: longitude }}
                        radius={Math.max(0, radius - 24)}
                        options={{
                          fillColor: color,
                          fillOpacity: 0.055,
                          strokeOpacity: 0,
                          clickable: false,
                          zIndex: 29,
                        }}
                      />
                    </React.Fragment>
                  );
                }

                return <CircleF key={zone.id} center={{ lat: latitude, lng: longitude }} radius={radius} options={{
                  fillColor: color,
                  fillOpacity: 0.22,
                  strokeColor: color,
                  strokeOpacity: 0.55,
                  strokeWeight: 1,
                  zIndex: 10,
                }} />;
              }
              return null;
            })}
          </>
        )}

        {selectedPlace && (
          <InfoWindowF
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onCloseClick={() => setSelectedPlace(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -22) }}
          >
            <div className="emergency-info-window-content w-[210px] sm:w-[250px] pr-1 text-slate-900 font-sans">
              <h3 className="text-[12px] sm:text-[13px] leading-4 font-extrabold text-slate-900 break-words whitespace-normal">
                {selectedPlace.name}
              </h3>
              {selectedPlace.vicinity && (
                <div className="mt-2 flex items-start gap-2">
                  <MapPin className="w-3 h-3 mt-0.5 text-slate-400 shrink-0" />
                  <p className="min-w-0 text-[10px] sm:text-[11px] leading-4 text-slate-600 font-medium break-words whitespace-normal">
                    {selectedPlace.vicinity}
                  </p>
                </div>
              )}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
