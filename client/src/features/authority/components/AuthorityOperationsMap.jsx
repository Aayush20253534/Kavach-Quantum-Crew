import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, InfoWindowF, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api';
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


const routeOriginForUnit = (unit) =>
  finitePoint(
    unit.baseLatitude ?? unit.baseLocation?.latitude ?? unit.latitude,
    unit.baseLongitude ?? unit.baseLocation?.longitude ?? unit.longitude,
  );

const nearestOverviewPathIndex = (overviewPath, point) => {
  if (!overviewPath?.length || !point) return -1;

  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  overviewPath.forEach((pathPoint, index) => {
    const lat = typeof pathPoint.lat === 'function' ? pathPoint.lat() : Number(pathPoint.lat);
    const lng = typeof pathPoint.lng === 'function' ? pathPoint.lng() : Number(pathPoint.lng);
    const latDelta = lat - point.lat;
    const lngDelta = lng - point.lng;
    const distance = (latDelta * latDelta) + (lngDelta * lngDelta);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const nearestOverviewPathPoint = (overviewPath, point) => {
  const index = nearestOverviewPathIndex(overviewPath, point);
  return index >= 0 ? { index, point: overviewPath[index] } : null;
};



const plainOverviewPath = (overviewPath = []) =>
  overviewPath
    .map((point) => {
      const lat = typeof point?.lat === 'function' ? point.lat() : Number(point?.lat);
      const lng = typeof point?.lng === 'function' ? point.lng() : Number(point?.lng);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    })
    .filter(Boolean);




const EARTH_RADIUS_M = 6378137;

const pointOffsetMeters = (point, northM, eastM) => {
  const latRadians = (point.lat * Math.PI) / 180;

  return {
    lat: point.lat + ((northM / EARTH_RADIUS_M) * 180) / Math.PI,
    lng:
      point.lng +
      (((eastM / EARTH_RADIUS_M) * 180) / Math.PI) /
        Math.max(0.2, Math.cos(latRadians)),
  };
};

const routeDestinationCandidates = (destination) => {
  const radii = [35, 70, 120, 200, 320];
  const directions = [
    [1, 0],
    [0.7071, 0.7071],
    [0, 1],
    [-0.7071, 0.7071],
    [-1, 0],
    [-0.7071, -0.7071],
    [0, -1],
    [0.7071, -0.7071],
  ];

  const candidates = [{ point: destination }];

  radii.forEach((radius) => {
    directions.forEach(([northFactor, eastFactor]) => {
      candidates.push({
        point: pointOffsetMeters(
          destination,
          radius * northFactor,
          radius * eastFactor,
        ),
      });
    });
  });

  return candidates;
};

const pointDistanceSquared = (left, right) => {
  if (!left || !right) return Number.POSITIVE_INFINITY;

  const latDelta = Number(left.lat) - Number(right.lat);
  const lngDelta = Number(left.lng) - Number(right.lng);

  return (latDelta * latDelta) + (lngDelta * lngDelta);
};

const roadEndpointFromDirections = (result, fallbackPoint) => {
  const route = result?.routes?.[0];
  const leg = route?.legs?.[route.legs.length - 1];
  const endLocation = leg?.end_location;

  if (endLocation) {
    return {
      lat:
        typeof endLocation.lat === 'function'
          ? endLocation.lat()
          : Number(endLocation.lat),
      lng:
        typeof endLocation.lng === 'function'
          ? endLocation.lng()
          : Number(endLocation.lng),
    };
  }

  const overview = plainOverviewPath(route?.overview_path ?? []);
  return overview[overview.length - 1] || fallbackPoint;
};

const haversineMeters = (left, right) => {
  if (!left || !right) return 0;

  const toRadians = (value) => (value * Math.PI) / 180;
  const lat1 = toRadians(left.lat);
  const lat2 = toRadians(right.lat);
  const latDelta = toRadians(right.lat - left.lat);
  const lngDelta = toRadians(right.lng - left.lng);

  const a =
    (Math.sin(latDelta / 2) ** 2) +
    (Math.cos(lat1) * Math.cos(lat2) * (Math.sin(lngDelta / 2) ** 2));

  return 2 * 6371000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const pathDistanceMeters = (path = []) =>
  path.reduce(
    (total, point, index) =>
      index === 0 ? total : total + haversineMeters(path[index - 1], point),
    0,
  );

const formatDistance = (distanceM) => {
  if (!Number.isFinite(distanceM)) return null;
  if (distanceM < 1000) return `${Math.max(0, Math.round(distanceM))} m`;
  return `${(distanceM / 1000).toFixed(distanceM < 10000 ? 1 : 0)} km`;
};


export function AuthorityOperationsMap({ incidents = [], units = [], showRoutes = false, onRouteSummary, referencePoints = [] }) {
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

  const routeRequestKey = useMemo(
    () =>
      JSON.stringify({
        showRoutes,
        destination:
          incidents.length === 1
            ? [
                incidents[0].latitude ?? incidents[0].location?.latitude ?? null,
                incidents[0].longitude ?? incidents[0].location?.longitude ?? null,
              ]
            : null,
        origins: units.map((unit) => ({
          id: unit.id,
          latitude: unit.baseLatitude ?? unit.baseLocation?.latitude ?? unit.latitude ?? null,
          longitude: unit.baseLongitude ?? unit.baseLocation?.longitude ?? unit.longitude ?? null,
        })),
      }),
    [incidents, showRoutes, units],
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
        const origin = routeOriginForUnit(unit);
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

    const requestRoute = ({ origin, candidateDestination }) =>
      new Promise((resolve) => {
        service.route(
          {
            origin,
            destination: candidateDestination,
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false,
          },
          (result, status) => {
            if (status !== window.google.maps.DirectionsStatus.OK || !result) {
              resolve(null);
              return;
            }

            const route = result.routes?.[0];
            const leg = route?.legs?.[0];
            const overviewPath = plainOverviewPath(route?.overview_path ?? []);

            resolve({
              result,
              distanceText: leg?.distance?.text ?? null,
              distanceM: leg?.distance?.value ?? null,
              durationText: leg?.duration?.text ?? null,
              durationSeconds: leg?.duration?.value ?? null,
              overviewPath,
              roadEndpoint: roadEndpointFromDirections(
                result,
                overviewPath[overviewPath.length - 1] || candidateDestination,
              ),
            });
          },
        );
      });

    const findNearestRoadRoute = async ({ unit, origin }) => {
      const candidates = routeDestinationCandidates(destination);

      for (const candidate of candidates) {
        if (cancelled || requestId !== routeRequestRef.current) return null;

        // eslint-disable-next-line no-await-in-loop
        const routed = await requestRoute({
          origin,
          candidateDestination: candidate.point,
        });

        if (!routed) continue;

        return {
          unitId: unit.id,
          unitName: unit.name,
          ...routed,
          exactDestination: destination,
          fallback: false,
        };
      }

      return {
        unitId: unit.id,
        unitName: unit.name,
        result: null,
        distanceText: null,
        distanceM: null,
        durationText: null,
        durationSeconds: null,
        overviewPath: [],
        roadEndpoint: null,
        exactDestination: destination,
        fallback: true,
      };
    };

    Promise.all(
      routeUnits.map(({ unit, origin }) =>
        findNearestRoadRoute({ unit, origin }),
      ),

    ).then((resolved) => {
      if (cancelled || requestId !== routeRequestRef.current) return;
      const successful = resolved.filter(Boolean);
      setRoutes(successful);
      onRouteSummary?.(
        successful.map(({ result: _result, overviewPath: _overviewPath, ...summary }) => summary),
      );
    });

    return () => {
      cancelled = true;
      routeRequestRef.current += 1;
    };
  }, [isLoaded, onRouteSummary, routeRequestKey, showRoutes]); // route is anchored to fleet base; live GPS only advances progress



  const routeProgress = useMemo(
    () =>
      routes.map((route) => {
        const unit = units.find((candidate) => candidate.id === route.unitId);
        const livePoint = unit ? finitePoint(unit.latitude, unit.longitude) : null;
        const fullPath = plainOverviewPath(route.overviewPath);
        const exactDestination = finitePoint(
          route.exactDestination?.lat,
          route.exactDestination?.lng,
        );
        const roadEndpoint = finitePoint(
          route.roadEndpoint?.lat,
          route.roadEndpoint?.lng,
        );

        if (route.fallback || !fullPath.length) {
          const destinationConnectorPath =
            livePoint && exactDestination ? [livePoint, exactDestination] : [];
          const remainingDistanceM = pathDistanceMeters(destinationConnectorPath);

          return {
            ...route,
            travelledPath: [],
            remainingPath: [],
            liveConnectorPath: [],
            destinationConnectorPath,
            remainingDistanceM,
            remainingDistanceText: formatDistance(remainingDistanceM),
          };
        }

        let travelledPath = [];
        let remainingPath = fullPath;
        let liveConnectorPath = [];

        if (livePoint) {
          const nearest = nearestOverviewPathPoint(fullPath, livePoint);

          if (nearest) {
            travelledPath =
              nearest.index > 0
                ? fullPath.slice(0, nearest.index + 1)
                : [fullPath[0]];

            remainingPath = fullPath.slice(nearest.index);

            if (pointDistanceSquared(livePoint, nearest.point) > 0.00000001) {
              liveConnectorPath = [livePoint, nearest.point];
            }
          }
        }

        const destinationConnectorPath =
          roadEndpoint &&
          exactDestination &&
          pointDistanceSquared(roadEndpoint, exactDestination) > 0.00000001
            ? [roadEndpoint, exactDestination]
            : [];

        const remainingDistanceM =
          pathDistanceMeters(liveConnectorPath) +
          pathDistanceMeters(remainingPath) +
          pathDistanceMeters(destinationConnectorPath);

        return {
          ...route,
          travelledPath,
          remainingPath,
          liveConnectorPath,
          destinationConnectorPath,
          remainingDistanceM,
          remainingDistanceText: formatDistance(remainingDistanceM),
        };
      }),
    [routes, units],
  );

  useEffect(() => {
    if (!onRouteSummary) return;

    onRouteSummary(
      routeProgress.map((route) => ({
        unitId: route.unitId,
        unitName: route.unitName,
        distanceText: route.distanceText ?? null,
        distanceM: route.distanceM ?? null,
        durationText: route.durationText ?? null,
        durationSeconds: route.durationSeconds ?? null,
        remainingDistanceM: route.remainingDistanceM ?? null,
        remainingDistanceText: route.remainingDistanceText ?? null,
      })),
    );
  }, [onRouteSummary, routeProgress]);

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
      {routeProgress.map((route) => (
        <React.Fragment key={`route-${route.unitId}`}>
          {route.travelledPath.length >= 2 && (
            <PolylineF
              path={route.travelledPath}
              options={{
                strokeColor: '#64748b',
                strokeOpacity: 0.95,
                strokeWeight: 7,
                clickable: false,
                zIndex: 20,
              }}
            />
          )}

          {route.remainingPath.length >= 2 && (
            <PolylineF
              path={route.remainingPath}
              options={{
                strokeColor: '#2563eb',
                strokeOpacity: 0.95,
                strokeWeight: 7,
                clickable: false,
                zIndex: 21,
              }}
            />
          )}

          {route.liveConnectorPath.length >= 2 && (
            <PolylineF
              path={route.liveConnectorPath}
              options={{
                strokeOpacity: 0,
                clickable: false,
                zIndex: 22,
                icons: [{
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#64748b',
                    fillOpacity: 1,
                    strokeOpacity: 0,
                    scale: 2.1,
                  },
                  offset: '0',
                  repeat: '10px',
                }],
              }}
            />
          )}

          {route.destinationConnectorPath.length >= 2 && (
            <PolylineF
              path={route.destinationConnectorPath}
              options={{
                strokeOpacity: 0,
                clickable: false,
                zIndex: 23,
                icons: [{
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                    strokeOpacity: 0,
                    scale: 2.2,
                  },
                  offset: '0',
                  repeat: '10px',
                }],
              }}
            />
          )}
        </React.Fragment>
      ))}


      {markers.map((marker) => {
        const isIncident = marker.kind === 'incident';
        const isReference = marker.kind === 'reference';
        // Response routing keeps incident/tourist red, uses the service accent for the live unit,
        // and reserves blue for the fleet's fixed registered base location.
        const color = isReference
          ? (marker.data.color || '#2563eb')
          : showRoutes
            ? (isIncident ? '#dc2626' : '#16a34a')
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
