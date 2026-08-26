import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DirectionsRenderer, GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from '@react-google-maps/api';
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

export function AuthorityOperationsMap({ incidents = [], units = [], showRoutes = false, onRouteSummary }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [routes, setRoutes] = useState([]);

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
    if (!isLoaded || !showRoutes || !window.google?.maps || incidents.length !== 1) {
      setRoutes([]);
      onRouteSummary?.([]);
      return undefined;
    }

    const destination = finitePoint(
      incidents[0].latitude ?? incidents[0].location?.latitude,
      incidents[0].longitude ?? incidents[0].location?.longitude,
    );
    if (!destination) {
      setRoutes([]);
      onRouteSummary?.([]);
      return undefined;
    }

    const routeUnits = units
      .map((unit) => {
        const origin = finitePoint(unit.latitude, unit.longitude);
        return origin ? { unit, origin } : null;
      })
      .filter(Boolean);

    if (!routeUnits.length) {
      setRoutes([]);
      onRouteSummary?.([]);
      return undefined;
    }

    let cancelled = false;
    const service = new window.google.maps.DirectionsService();

    Promise.all(
      routeUnits.map(({ unit, origin }) =>
        new Promise((resolve) => {
          service.route(
            {
              origin,
              destination,
              travelMode: window.google.maps.TravelMode.DRIVING,
              provideRouteAlternatives: false,
            },
            (result, status) => {
              if (status !== window.google.maps.DirectionsStatus.OK || !result) {
                resolve(null);
                return;
              }
              const leg = result.routes?.[0]?.legs?.[0];
              resolve({
                unitId: unit.id,
                unitName: unit.name,
                result,
                distanceText: leg?.distance?.text ?? null,
                distanceM: leg?.distance?.value ?? null,
                durationText: leg?.duration?.text ?? null,
                durationSeconds: leg?.duration?.value ?? null,
              });
            },
          );
        }),
      ),
    ).then((resolved) => {
      if (cancelled) return;
      const successful = resolved.filter(Boolean);
      setRoutes(successful);
      onRouteSummary?.(
        successful.map(({ result, ...summary }) => summary),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [incidents, isLoaded, onRouteSummary, showRoutes, units]);

  const fitVisibleMarkers = (map) => {
    if (!map || markers.length === 0 || !window.google?.maps) return;
    if (markers.length === 1) {
      map.panTo(markers[0].point);
      map.setZoom(14);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    markers.forEach((marker) => bounds.extend(marker.point));
    map.fitBounds(bounds, 72);
  };

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    fitVisibleMarkers(mapRef.current);
  }, [isLoaded, markers]); // eslint-disable-line react-hooks/exhaustive-deps

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
      onLoad={(map) => {
        mapRef.current = map;
        // The markers may already exist before the GoogleMap instance mounts.
        // Fit once here as well so the fleet origin is never left off-screen.
        window.requestAnimationFrame(() => fitVisibleMarkers(map));
      }}
      onUnmount={() => { mapRef.current = null; }}
      options={{ fullscreenControl: true, streetViewControl: false, mapTypeControl: true, clickableIcons: false }}
    >
      {routes.map((route) => (
        <DirectionsRenderer
          key={`route-${route.unitId}`}
          directions={route.result}
          options={{
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: '#16a34a',
              strokeOpacity: 0.9,
              strokeWeight: 6,
            },
          }}
        />
      ))}


      {markers.map((marker) => {
        const isIncident = marker.kind === 'incident';
        // In response-routing mode the visual language is intentionally fixed:
        // tourist/incident = red, responding fleet = green.
        const color = showRoutes
          ? (isIncident ? '#dc2626' : '#16a34a')
          : (isIncident ? incidentColor(marker.data.severity || marker.data.priority) : unitColor(marker.data.type));
        return (
          <MarkerF
            key={`${marker.kind}-${marker.id}`}
            position={marker.point}
            onClick={() => setSelected(marker)}
            title={isIncident ? 'Tourist / incident location' : `${marker.data.name || marker.data.type || 'Emergency'} fleet`}
            zIndex={isIncident ? 1000 : 1100}
            icon={{
              path: isIncident ? window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW : window.google.maps.SymbolPath.CIRCLE,
              scale: isIncident ? 7 : 10,
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
                <p className="text-[11px] font-black uppercase tracking-wide text-red-600">{showRoutes ? 'Tourist / Incident' : 'Incident'}</p>
                <p className="mt-1 text-[13px] font-black text-slate-900">{selected.data.title || selected.data.type || 'Emergency Incident'}</p>
                <p className="mt-1 text-[11px] text-slate-600">{selected.data.description || 'No description provided.'}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">{selected.data.status} · {selected.data.severity || selected.data.priority}</p>
              </>
            ) : (
              <>
                <p className={`text-[11px] font-black uppercase tracking-wide ${showRoutes ? 'text-emerald-600' : 'text-slate-500'}`}>{selected.data.type} Fleet</p>
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
