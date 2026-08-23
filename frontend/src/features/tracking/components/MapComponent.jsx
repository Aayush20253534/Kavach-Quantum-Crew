import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, CircleF, PolygonF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem' // tailwind rounded-lg equivalent to match Kavach UI
};

export function MapComponent({ 
  currentLocation, 
  groupLocations = [], 
  riskZones = [], 
  className = "h-96 w-full rounded-lg shadow-md" 
}) {
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState(null);
  
  // Default to Prayagraj coordinates if no location
  const center = currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : { lat: 25.4358, lng: 81.8463 };
  
  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // Recenter map when current location changes
  useEffect(() => {
    if (map && currentLocation) {
      map.panTo({ lat: currentLocation.lat, lng: currentLocation.lng });
    }
  }, [currentLocation, map]);

  if (loadError) {
    return (
      <div className={`bg-slate-100 flex flex-col items-center justify-center border border-slate-200 text-slate-500 font-bold ${className}`}>
        <p className="text-red-500 mb-2">Error loading Google Maps</p>
        <p className="text-[10px] uppercase">Please check your API Key in .env</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-[11px] animate-pulse ${className}`}>
        Initializing Radar...
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
      >
        {/* Current User Marker */}
        {currentLocation && (
          <>
            <MarkerF 
              position={{ lat: currentLocation.lat, lng: currentLocation.lng }} 
              animation={window.google.maps.Animation.DROP}
            />
            {currentLocation.accuracy && (
              <CircleF 
                center={{ lat: currentLocation.lat, lng: currentLocation.lng }} 
                radius={currentLocation.accuracy} 
                options={{ fillColor: '#3b82f6', fillOpacity: 0.15, strokeColor: '#3b82f6', strokeWeight: 1 }}
              />
            )}
          </>
        )}

        {/* Group Members */}
        {groupLocations.map(loc => (
          <MarkerF 
            key={loc.userId || loc.id} 
            position={{ lat: loc.lat, lng: loc.lng }} 
            label={{
              text: loc.userName?.[0] || 'G',
              color: 'white',
              fontWeight: 'bold',
            }}
            options={{
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: "#16a34a",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff"
              }
            }}
          />
        ))}

        {/* Risk Zones */}
        {riskZones.map(zone => {
          const isDanger = zone.severity === 'CRITICAL' || zone.severity === 'HIGH';
          const color = isDanger ? '#ef4444' : zone.severity === 'LOW' ? '#22c55e' : '#f97316';
          
          if (zone.type === 'POLYGON' && zone.coordinates) {
             const paths = zone.coordinates.map(coord => 
                Array.isArray(coord) ? { lat: coord[0], lng: coord[1] } : coord
             );
             return (
               <PolygonF 
                 key={zone.id} 
                 paths={paths} 
                 options={{ fillColor: color, fillOpacity: 0.35, strokeColor: color, strokeWeight: 2 }}
               />
             )
          } else if (zone.type === 'CIRCLE') {
            return (
              <CircleF
                key={zone.id}
                center={{ lat: zone.center.lat, lng: zone.center.lng }}
                radius={zone.radius}
                options={{ fillColor: color, fillOpacity: 0.35, strokeColor: color, strokeWeight: 2 }}
              />
            )
          }
          return null;
        })}
      </GoogleMap>
    </div>
  );
}
