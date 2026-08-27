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
  // Number(null) and Number('') become 0, which previously placed missing data
  // in the Gulf of Guinea and made the command map zoom across half the planet.
  if (latitude === null || latitude === undefined || latitude === '' || longitude === null || longitude === undefined || longitude === '') return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
};

export function AuthorityOperationsMap({ incidents = [], units = [], showRoutes = false, onRouteSummary, routeUnitColor = '#16a34a', routeLineColor = '#111827', referencePoints = [] }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  const fittedContextRef = useRef('');
  const routeRequestRef = useRef(0);
  const [selected, setSelected] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [mapTypeId, setMapTypeId] = useState('roadmap');

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

    const referenceMarkers = referencePoints
      .map((reference) => {
        const point = finitePoint(reference.latitude, reference.longitude);
        return point ? { kind: 'reference', id: reference.id, point, data: reference } : null;
      })
      .filter(Boolean);

    return [...incidentMarkers, ...unitMarkers, ...referenceMarkers];
  }, [incidents, referencePoints, units]);

  const viewportContextKey = useMemo(
    () =>
      [
        incidents.map((incident) => `incident:${incident.id}`).join(','),
        units.map((unit) => `unit:${unit.id}`).join(','),
        referencePoints.map((reference) => `reference:${reference.id}`).join(','),
        showRoutes ? 'routes:on' : 'routes:off',
      ].join('|'),
    [incidents, referencePoints, showRoutes, units],
  );

  useEffect(() => {
    const requestId = ++routeRequestRef.current;

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
      if (cancelled || requestId !== routeRequestRef.current) return;
      const successful = resolved.filter(Boolean);
      setRoutes(successful);
      onRouteSummary?.(
        successful.map(({ result, ...summary }) => summary),
      );
    });

    return () => {
      cancelled = true;
      routeRequestRef.current += 1;
    };
  }, [incidents, isLoaded, onRouteSummary, routeLineColor, showRoutes, units]);

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
    window.google.maps.event.addListenerOnce(map, 'idle', () => {
      if ((map.getZoom?.() ?? 0) > 16) map.setZoom(16);
    });
  };

  useEffect(() => {
    if (!isLoaded || !mapRef.current || markers.length === 0) return;

    // Live responder GPS updates change marker coordinates every few seconds.
    // Do not re-fit on those updates or the map will fight manual zoom/pan.
    // Re-fit only when the actual operational context changes, such as
    // selecting a different dispatch or adding/removing a route marker.
    if (fittedContextRef.current === viewportContextKey) return;

    fittedContextRef.current = viewportContextKey;
    fitVisibleMarkers(mapRef.current);
  }, [isLoaded, markers.length, viewportContextKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="relative isolate z-0 h-full w-full overflow-hidden">
      <div className="absolute left-3 top-3 z-10 inline-flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        {[
          ['roadmap', 'Map'],
          ['satellite', 'Satellite'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMapTypeId(value)}
            className={`h-8 border-r border-slate-200 px-3 text-[10px] font-bold last:border-r-0 ${
              mapTypeId === value
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <GoogleMap
      mapContainerStyle={containerStyle}
      mapContainerClassName="fleet-operations-map"
      center={markers[0]?.point || defaultCenter}
      zoom={markers.length ? 12 : 6}
      mapTypeId={mapTypeId}
      onLoad={(map) => {
        mapRef.current = map;
        // Establish the initial viewport once. Subsequent GPS updates preserve
        // the operator's chosen zoom and pan.
        window.requestAnimationFrame(() => {
          fittedContextRef.current = viewportContextKey;
          fitVisibleMarkers(map);
        });
      }}
      onUnmount={() => {
        routeRequestRef.current += 1;
        setRoutes([]);
        setSelected(null);
        if (window.google?.maps && mapRef.current) {
          window.google.maps.event.clearInstanceListeners(mapRef.current);
        }
        mapRef.current = null;
        fittedContextRef.current = '';
      }}
      options={{
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: 'greedy',
        scrollwheel: true,
        controlSize: 28,
        minZoom: 3,
        maxZoom: 20,
      }}
    >
      {routes.map((route) => (
        <DirectionsRenderer
          key={`route-${route.unitId}`}
          directions={route.result}
          options={{
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: routeLineColor,
              strokeOpacity: 0.9,
              strokeWeight: 6,
            },
          }}
        />
      ))}


      {markers.map((marker) => {
        const isIncident = marker.kind === 'incident';
        const isReference = marker.kind === 'reference';
        // Response routing keeps incident/tourist red, uses the service accent for the live unit,
        // and reserves blue for the fleet's fixed registered base location.
        const color = isReference
          ? (marker.data.color || '#2563eb')
          : showRoutes
            ? (isIncident ? '#dc2626' : routeUnitColor)
            : (isIncident ? incidentColor(marker.data.severity || marker.data.priority) : unitColor(marker.data.type));
        return (
          <MarkerF
            key={`${marker.kind}-${marker.id}`}
            position={marker.point}
            onClick={() => setSelected(marker)}
            title={isReference ? (marker.data.label || 'Fleet Base') : isIncident ? 'Tourist / incident location' : `${marker.data.name || marker.data.type || 'Emergency'} fleet`}
            zIndex={isReference ? 900 : isIncident ? 1000 : 1100}
            icon={{
              path: isIncident ? window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW : window.google.maps.SymbolPath.CIRCLE,
              scale: isIncident ? 7 : isReference ? 8 : 10,
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
            {selected.kind === 'reference' ? (
              <>
                <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Fleet Base</p>
                <p className="mt-1 text-[13px] font-black text-slate-900">{selected.data.name || 'Registered fleet location'}</p>
                <p className="mt-1 text-[11px] text-slate-600">Fixed location configured for this emergency-service account.</p>
              </>
            ) : selected.kind === 'incident' ? (
              <>
                <p className="text-[11px] font-black uppercase tracking-wide text-red-600">{showRoutes ? 'Tourist / Incident' : 'Incident'}</p>
                <p className="mt-1 text-[13px] font-black text-slate-900">{selected.data.title || selected.data.type || 'Emergency Incident'}</p>
                <p className="mt-1 text-[11px] text-slate-600">{selected.data.description || 'No description provided.'}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">{selected.data.status} · {selected.data.severity || selected.data.priority}</p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-600">{selected.data.type} Fleet</p>
                <p className="mt-1 text-[13px] font-black text-slate-900">{selected.data.name}</p>
                <p className="mt-1 text-[11px] text-slate-600">{selected.data.organization || selected.data.jurisdiction || 'Emergency unit'}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-500">Status: {selected.data.status}</p>
              </>
            )}
          </div>
        </InfoWindowF>
      )}
      </GoogleMap>
    </div>
  );
}
