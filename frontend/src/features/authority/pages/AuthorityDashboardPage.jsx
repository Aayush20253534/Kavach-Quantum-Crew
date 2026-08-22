import React from 'react';
import { useAllAlerts, useAllIncidents, useResolveIncident } from '../api/authorityQueries';
import { useRiskZones } from '../../tracking/api/trackingQueries';
import { MapComponent } from '../../tracking/components/MapComponent';

export function AuthorityDashboardPage() {
  const { data: alertsData, isLoading: alertsLoading } = useAllAlerts();
  const { data: incidentsData, isLoading: incidentsLoading } = useAllIncidents();
  const { data: riskZonesData } = useRiskZones();
  
  const resolveMutation = useResolveIncident();

  const alerts = alertsData?.items || alertsData || [];
  const incidents = incidentsData?.items || incidentsData || [];
  const riskZones = riskZonesData?.items || riskZonesData || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Command Center</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Map Area */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Global Overview</h2>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600"></span> SOS/Danger</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Hazards</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Safe Havens</span>
            </div>
          </div>
          {/* We'll pass a default center (Prayagraj) if no specific location is provided */}
          <MapComponent 
            riskZones={riskZones} 
            className="h-[600px] w-full"
            currentLocation={{lat: 25.4358, lng: 81.8463}} 
          />
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          
          {/* Active SOS Alerts */}
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm p-4 h-72 overflow-y-auto">
            <h2 className="font-bold text-red-800 flex items-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              ACTIVE SOS ALERTS
            </h2>
            
            {alertsLoading ? (
              <p className="text-red-500">Loading...</p>
            ) : alerts.length === 0 ? (
              <p className="text-red-600 text-sm">No active SOS alerts at this time.</p>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="bg-white p-3 rounded border border-red-300 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-red-700">SOS #{alert.id.slice(0,6)}</span>
                      <span className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm font-medium">Tourist ID: {alert.touristId}</p>
                    {alert.location && (
                      <p className="text-xs text-gray-600 mt-1">
                        Loc: {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reported Incidents/Hazards */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 h-72 overflow-y-auto">
            <h2 className="font-bold text-gray-800 mb-4">Recent Hazard Reports</h2>
            
            {incidentsLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : incidents.length === 0 ? (
              <p className="text-gray-500 text-sm">No hazards reported.</p>
            ) : (
              <div className="space-y-3">
                {incidents.map(inc => (
                  <div key={inc.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 text-sm">{inc.type}</span>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        inc.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' : 
                        inc.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 truncate" title={inc.description}>
                      {inc.description}
                    </p>
                    <button 
                      onClick={() => resolveMutation.mutate(inc.id)}
                      disabled={resolveMutation.isPending}
                      className="text-xs text-blue-600 font-medium hover:underline"
                    >
                      Mark Resolved
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
