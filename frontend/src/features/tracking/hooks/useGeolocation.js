import { useState, useEffect, useRef } from 'react';
import { useSendPing } from '../api/trackingQueries';

export const useGeolocation = (tripId, active) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState('prompt');
  
  const pingMutation = useSendPing();
  const watchId = useRef(null);

  // Check initial permission
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermission(result.state);
        result.onchange = () => setPermission(result.state);
      });
    }
  }, []);

  useEffect(() => {
    // Only track if there's an active trip and we want to track
    if (!active || !tripId) {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const successHandler = (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
        timestamp: position.timestamp,
        tripId
      };
      
      setLocation(coords);
      setError('');
      
      // Ping backend silently
      pingMutation.mutate(coords).catch(err => {
        console.error('Failed to ping location', err);
      });
    };

    const errorHandler = (err) => {
      setError(err.message);
      if (err.code === 1) setPermission('denied');
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    };

    // Start watching
    watchId.current = navigator.geolocation.watchPosition(successHandler, errorHandler, options);

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [tripId, active, pingMutation]);

  return { location, error, permission };
};
