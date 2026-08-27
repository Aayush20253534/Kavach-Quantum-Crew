const validCoordinate = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
};

const normalizeLocation = (value) => {
  if (!value) return null;

  const latitude = value.latitude ?? value.lat;
  const longitude = value.longitude ?? value.lng;

  if (!validCoordinate(latitude, longitude)) return null;

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracyM: Math.max(
      1,
      Number(value.accuracyM ?? value.accuracy ?? 1) || 1,
    ),
  };
};

/**
 * SOS must use the freshest location we can obtain.
 *
 * Mobile browsers sometimes delay watchPosition updates while backgrounded,
 * so an SOS explicitly asks for a new high-accuracy fix first. If that request
 * times out, the caller's latest in-memory location is used as a short-lived
 * fallback. The backend performs one final trusted-location fallback.
 */
export const getEmergencyLocation = (fallbackLocation = null) =>
  new Promise((resolve) => {
    const fallback = normalizeLocation(fallbackLocation);

    if (!navigator.geolocation) {
      resolve(fallback);
      return;
    }

    let settled = false;

    const finish = (location) => {
      if (settled) return;
      settled = true;
      resolve(normalizeLocation(location) || fallback);
    };

    const timeoutId = window.setTimeout(() => finish(fallback), 9000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timeoutId);
        finish({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyM: position.coords.accuracy,
        });
      },
      () => {
        window.clearTimeout(timeoutId);
        finish(fallback);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 5000,
      },
    );
  });

export const isValidEmergencyLocation = (value) =>
  Boolean(
    value &&
      validCoordinate(
        value.latitude ?? value.lat,
        value.longitude ?? value.lng,
      ),
  );
