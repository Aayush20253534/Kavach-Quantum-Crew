import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet not showing up properly due to webpack/vite module resolution
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


// Helper component to recenter map when location changes
const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export function MapComponent({ 
  currentLocation, 
  groupLocations = [], 
  riskZones = [], 
  className = "h-96 w-full rounded-lg shadow-md" 
}) {
  
  // Default to Prayagraj coordinates if no location
  const center = currentLocation ? [currentLocation.lat, currentLocation.lng] : [25.4358, 81.8463];

  return (
    <div className={className}>
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} className="rounded-lg">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {currentLocation && (
          <>
            <RecenterAutomatically lat={currentLocation.lat} lng={currentLocation.lng} />
            <Marker position={[currentLocation.lat, currentLocation.lng]}>
              <Popup>You are here</Popup>
            </Marker>
            {currentLocation.accuracy && (
              <Circle 
                center={[currentLocation.lat, currentLocation.lng]} 
                radius={currentLocation.accuracy} 
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }}
              />
            )}
          </>
        )}

        {groupLocations.map(loc => (
          <Marker key={loc.userId || loc.id} position={[loc.lat, loc.lng]}>
             <Popup>{loc.userName || 'Group Member'}</Popup>
          </Marker>
        ))}

        {riskZones.map(zone => {
          const isDanger = zone.severity === 'CRITICAL' || zone.severity === 'HIGH';
          const color = isDanger ? 'red' : zone.severity === 'LOW' ? 'green' : 'orange';
          
          if (zone.type === 'POLYGON' && zone.coordinates) {
             // Leaflet expects [lat, lng], GeoJSON is usually [lng, lat]
             // We'll assume the backend sends coordinates compatible with what we need or we map them.
             // For now, assuming standard Leaflet formatting from our generic API.
             return (
               <Polygon 
                 key={zone.id} 
                 positions={zone.coordinates} 
                 pathOptions={{ color, fillColor: color, fillOpacity: 0.3 }}
               >
                 <Popup>{zone.name} ({zone.severity})</Popup>
               </Polygon>
             )
          } else if (zone.type === 'CIRCLE') {
            return (
              <Circle
                key={zone.id}
                center={[zone.center.lat, zone.center.lng]}
                radius={zone.radius}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.3 }}
              >
                <Popup>{zone.name} ({zone.severity})</Popup>
              </Circle>
            )
          }
          return null;
        })}

      </MapContainer>
    </div>
  );
}
