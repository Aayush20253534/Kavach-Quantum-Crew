import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MarkerF, PolylineF } from '@react-google-maps/api';

const finitePoint = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;

  return { lat, lng };
};

const plainPath = (overviewPath = []) =>
  overviewPath
    .map((point) => {
      const lat = typeof point?.lat === 'function' ? point.lat() : Number(point?.lat);
      const lng = typeof point?.lng === 'function' ? point.lng() : Number(point?.lng);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    })
    .filter(Boolean);

const nearestIndex = (path, point) => {
  if (!path.length || !point) return -1;

  let bestIndex = -1;
  let bestScore = Number.POSITIVE_INFINITY;

  path.forEach((candidate, index) => {
    const latDelta = candidate.lat - point.lat;
    const lngDelta = candidate.lng - point.lng;
    const score = (latDelta * latDelta) + (lngDelta * lngDelta);

    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const EARTH_RADIUS_M = 6378137;

const offsetMeters = (point, northM, eastM) => {
  const latRadians = (point.lat * Math.PI) / 180;

  return {
    lat: point.lat + ((northM / EARTH_RADIUS_M) * 180) / Math.PI,
    lng:
      point.lng +
      (((eastM / EARTH_RADIUS_M) * 180) / Math.PI) /
        Math.max(0.2, Math.cos(latRadians)),
  };
};

const destinationCandidates = (destination) => {
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
        point: offsetMeters(
          destination,
          radius * northFactor,
          radius * eastFactor,
        ),
      });
    });
  });

  return candidates;
};

const squaredDistance = (left, right) => {
  if (!left || !right) return Number.POSITIVE_INFINITY;

  const latDelta = left.lat - right.lat;
  const lngDelta = left.lng - right.lng;

  return (latDelta * latDelta) + (lngDelta * lngDelta);
};

const roadEnd = (result, fallbackPoint) => {
  const route = result?.routes?.[0];
  const leg = route?.legs?.[route.legs.length - 1];
  const endLocation = leg?.end_location;

  if (endLocation) {
    return {
      lat: typeof endLocation.lat === 'function' ? endLocation.lat() : Number(endLocation.lat),
      lng: typeof endLocation.lng === 'function' ? endLocation.lng() : Number(endLocation.lng),
    };
  }

  const path = plainPath(route?.overview_path ?? []);
  return path[path.length - 1] || fallbackPoint;
};

export function FleetResponseOverlay({ responses = [] }) {
  const [routes, setRoutes] = useState([]);
  const requestRef = useRef(0);

  const routeContext = useMemo(
    () =>
      JSON.stringify(
        responses.map((response) => ({
          id: response.dispatchId,
          base: [
            response.baseLocation?.latitude ?? null,
            response.baseLocation?.longitude ?? null,
          ],
          destination: [
            response.destination?.latitude ?? null,
            response.destination?.longitude ?? null,
          ],
        })),
      ),
    [responses],
  );

  useEffect(() => {
    if (!responses.length || !window.google?.maps?.DirectionsService) {
      setRoutes([]);
      return undefined;
    }

    let cancelled = false;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const service = new window.google.maps.DirectionsService();

    const requestRoute = (origin, destination) =>
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

            resolve({
              path: plainPath(result.routes?.[0]?.overview_path ?? []),
              roadEndpoint: roadEnd(result, destination),
            });
          },
        );
      });

    const buildRoute = async (response) => {
      const origin = finitePoint(
        response.baseLocation?.latitude ?? response.unit?.location?.latitude,
        response.baseLocation?.longitude ?? response.unit?.location?.longitude,
      );

      const destination = finitePoint(
        response.destination?.latitude,
        response.destination?.longitude,
      );

      if (!origin || !destination) return null;

      for (const candidate of destinationCandidates(destination)) {
        if (cancelled || requestId !== requestRef.current) return null;

        // eslint-disable-next-line no-await-in-loop
        const routed = await requestRoute(origin, candidate.point);

        if (!routed) continue;

        return {
          dispatchId: response.dispatchId,
          ...routed,
          exactDestination: destination,
        };
      }

      return {
        dispatchId: response.dispatchId,
        path: [],
        roadEndpoint: null,
        exactDestination: destination,
      };
    };

    Promise.all(responses.map(buildRoute)).then((resolved) => {
      if (cancelled || requestId !== requestRef.current) return;
      setRoutes(resolved.filter(Boolean));
    });

    return () => {
      cancelled = true;
      requestRef.current += 1;
    };
  }, [responses, routeContext]);

  const progress = useMemo(
    () =>
      routes.map((route) => {
        const response = responses.find(
          (item) => item.dispatchId === route.dispatchId,
        );

        const live = finitePoint(
          response?.unit?.location?.latitude,
          response?.unit?.location?.longitude,
        );

        const path = plainPath(route.path);

        const destination = finitePoint(
          route.exactDestination?.lat,
          route.exactDestination?.lng,
        );

        const endpoint = finitePoint(
          route.roadEndpoint?.lat,
          route.roadEndpoint?.lng,
        );

        if (!path.length) {
          return {
            ...route,
            travelled: [],
            remaining: [],
            liveConnector: [],
            finalConnector: live && destination ? [live, destination] : [],
          };
        }

        let travelled = [];
        let remaining = path;
        let liveConnector = [];

        if (live) {
          const index = nearestIndex(path, live);

          if (index >= 0) {
            travelled = index > 0 ? path.slice(0, index + 1) : [path[0]];
            remaining = path.slice(index);

            if (squaredDistance(live, path[index]) > 0.00000001) {
              liveConnector = [live, path[index]];
            }
          }
        }

        const finalConnector =
          endpoint &&
          destination &&
          squaredDistance(endpoint, destination) > 0.00000001
            ? [endpoint, destination]
            : [];

        return {
          ...route,
          travelled,
          remaining,
          liveConnector,
          finalConnector,
        };
      }),
    [responses, routes],
  );

  return (
    <>
      {progress.map((route) => (
        <React.Fragment key={`tourist-fleet-route-${route.dispatchId}`}>
          {route.travelled.length >= 2 && (
            <PolylineF
              path={route.travelled}
              options={{
                strokeColor: '#64748b',
                strokeOpacity: 0.95,
                strokeWeight: 6,
                clickable: false,
                zIndex: 40,
              }}
            />
          )}

          {route.remaining.length >= 2 && (
            <PolylineF
              path={route.remaining}
              options={{
                strokeColor: '#2563eb',
                strokeOpacity: 0.95,
                strokeWeight: 6,
                clickable: false,
                zIndex: 41,
              }}
            />
          )}

          {[route.liveConnector, route.finalConnector].map((connector, index) =>
            connector.length >= 2 ? (
              <PolylineF
                key={`tourist-fleet-connector-${route.dispatchId}-${index}`}
                path={connector}
                options={{
                  strokeOpacity: 0,
                  clickable: false,
                  zIndex: 42 + index,
                  icons: [{
                    icon: {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: index === 0 ? '#64748b' : '#2563eb',
                      fillOpacity: 1,
                      strokeOpacity: 0,
                      scale: 2,
                    },
                    offset: '0',
                    repeat: '10px',
                  }],
                }}
              />
            ) : null,
          )}
        </React.Fragment>
      ))}

      {responses.map((response) => {
        const live = finitePoint(
          response.unit?.location?.latitude,
          response.unit?.location?.longitude,
        );

        const basePoint = finitePoint(
          response.baseLocation?.latitude,
          response.baseLocation?.longitude,
        );

        return (
          <React.Fragment key={`tourist-fleet-${response.dispatchId}`}>
            {basePoint && (
              <MarkerF
                position={basePoint}
                title="Fleet base"
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#2563eb',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeOpacity: 1,
                  strokeWeight: 2.5,
                }}
                zIndex={1230}
              />
            )}

            {live && (
              <MarkerF
                position={live}
                title="Live responding fleet"
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#16a34a',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeOpacity: 1,
                  strokeWeight: 2.5,
                }}
                zIndex={1240}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
