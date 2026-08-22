import React from 'react';
import { useCurrentTrip } from '../../trips/api/tripQueries';
import { useGeolocation } from '../../tracking/hooks/useGeolocation';
import { useRiskZones, useLatestLocations } from '../../tracking/api/trackingQueries';
import { MapComponent } from '../../tracking/components/MapComponent';
import { Link } from 'react-router-dom';

export function TouristDashboardPage() {
  const { data: currentTrip } = useCurrentTrip();
  
  // Track location if there's a trip that is active.
  const isActive = currentTrip?.status === 'ACTIVE';
  
  // The hook watches GPS and sends pings silently in the background
  const { location, permission, error: gpsError } = useGeolocation(currentTrip?.id, isActive);
  
  // Fetch risk zones (cached 15 mins)
  const { data: riskZonesData } = useRiskZones();
  const riskZones = riskZonesData?.items || riskZonesData || [];

  // Fetch other group members if it's a group trip
  const isGroup = currentTrip?.type === 'GROUP';
  const { data: groupLocations } = useLatestLocations(isGroup ? currentTrip?.groupId : null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tourist Dashboard</h1>
        {isActive && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Active Tracking
          </div>
        )}
      </div>

      {!isActive && permission === 'prompt' && currentTrip?.status === 'PLANNED' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Ready for your trip?</h3>
            <p className="text-sm">Start your trip to enable GPS tracking and real-time safety monitoring.</p>
          </div>
          <Link to="/tourist/trips/current" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
            Start Trip
          </Link>
        </div>
      )}
      
      {gpsError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <p className="font-semibold">GPS Warning</p>
          <p className="text-sm">{gpsError}</p>
        </div>
      )}

      {/* Map visualization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Live Safety Map</h2>
          <span className="text-xs text-gray-500">
            {location ? `Accuracy: ${Math.round(location.accuracy)}m` : 'Locating...'}
          </span>
        </div>
        
        {/* Render our Leaflet Map */}
        <MapComponent 
          currentLocation={location}
          riskZones={riskZones}
          groupLocations={Array.isArray(groupLocations) ? groupLocations : []}
          className="h-[500px] w-full"
        />
      </div>
      
    </div>
  );
}
