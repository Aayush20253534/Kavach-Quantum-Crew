import { useState, useEffect, useRef } from 'react';
import { useSendPing } from '../api/trackingQueries';

export const useGeolocation = (tripId, active = false) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState('prompt');
  const [isTracking, setIsTracking] = useState(false);
  const pingMutation = useSendPing();
  const watchId = useRef(null);
  const lastPingAt = useRef(0);

  useEffect(() => {
    if (!navigator.permissions?.query) return undefined;
    let permissionStatus;
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      permissionStatus = result;
      setPermission(result.state);
      result.onchange = () => setPermission(result.state);
    }).catch(() => {});
    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return undefined;
    }

    const successHandler = (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
        timestamp: position.timestamp,
        ...(tripId ? { tripId } : {}),
      };

      setLocation(coords);
      setError('');
      setIsTracking(true);

      // Dashboard/location UI should work without an active trip. Backend pings are
      // sent only while a real trip is active.
      if (active && tripId && Date.now() - lastPingAt.current >= 3000) {
        lastPingAt.current = Date.now();
        pingMutation.mutate(coords, {
          onError: (err) => console.error('Failed to ping location', err),
        });
      }
    };

    const errorHandler = (err) => {
      setError(err.message || 'Unable to get your location');
      setIsTracking(false);
      if (err.code === 1) setPermission('denied');
    };

    watchId.current = navigator.geolocation.watchPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000,
    });

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      setIsTracking(false);
    };
  }, [tripId, active]); // eslint-disable-line react-hooks/exhaustive-deps

  return { location, error, permission, isTracking };
};
