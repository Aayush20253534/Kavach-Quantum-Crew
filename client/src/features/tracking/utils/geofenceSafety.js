export const GROUP_GEOFENCE_RADIUS_M = 500;

export const metersBetween = (a, b) => {
  const R = 6371000;
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
};

export const isDangerZone = (zone) =>
  zone?.active !== false &&
  (zone?.type === 'RISK' ||
    zone?.type === 'DANGER' ||
    zone?.severity === 'HIGH' ||
    zone?.severity === 'CRITICAL');

export const zonePolygon = (zone) => {
  const coordinates = zone?.polygon || zone?.coordinates;
  if (!Array.isArray(coordinates)) return [];

  return coordinates
    .map((point) =>
      Array.isArray(point)
        ? { lat: Number(point[0]), lng: Number(point[1]) }
        : {
            lat: Number(point?.latitude ?? point?.lat),
            lng: Number(point?.longitude ?? point?.lng),
          },
    )
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
};

const pointInPolygon = (point, polygon) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses =
      (a.lng > point.lng) !== (b.lng > point.lng) &&
      point.lat <
        ((b.lat - a.lat) * (point.lng - a.lng)) /
          ((b.lng - a.lng) || Number.EPSILON) +
          a.lat;

    if (crosses) inside = !inside;
  }

  return inside;
};

const pointToSegmentMeters = (point, a, b) => {
  const latScale = 111320;
  const lngScale = 111320 * Math.cos((point.lat * Math.PI) / 180);
  const ax = (a.lng - point.lng) * lngScale;
  const ay = (a.lat - point.lat) * latScale;
  const bx = (b.lng - point.lng) * lngScale;
  const by = (b.lat - point.lat) * latScale;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared
    ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared))
    : 0;
  const x = ax + t * dx;
  const y = ay + t * dy;

  return Math.sqrt(x * x + y * y);
};

export const boundaryIntersectsDangerZone = (center, radiusM, zone) => {
  if (!center || !isDangerZone(zone)) return false;

  const geometryType = zone.geometryType || zone.type;

  if (geometryType === 'CIRCLE') {
    const latitude = Number(zone.latitude ?? zone.center?.lat);
    const longitude = Number(zone.longitude ?? zone.center?.lng);
    const zoneRadius = Number(zone.radiusM ?? zone.radius);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(zoneRadius)
    ) {
      return false;
    }

    return (
      metersBetween(center, { lat: latitude, lng: longitude }) <=
      Math.max(0, radiusM) + zoneRadius
    );
  }

  if (geometryType === 'POLYGON') {
    const polygon = zonePolygon(zone);
    if (polygon.length < 3) return false;
    if (pointInPolygon(center, polygon)) return true;

    return polygon.some(
      (point, index) =>
        pointToSegmentMeters(
          center,
          point,
          polygon[(index + 1) % polygon.length],
        ) <= Math.max(0, radiusM),
    );
  }

  return false;
};

export const findDangerZoneForTrip = ({
  location,
  zones = [],
  trip = null,
  groupRadiusM = GROUP_GEOFENCE_RADIUS_M,
}) => {
  if (!location) return null;

  const center = {
    lat: Number(location.lat ?? location.latitude),
    lng: Number(location.lng ?? location.longitude),
  };

  if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) {
    return null;
  }

  // Group trips are unsafe as soon as the group safety boundary overlaps a
  // danger geofence. Solo trips only check the tourist's actual position.
  const radiusM = trip?.tripType === 'GROUP' ? groupRadiusM : 0;

  return (
    zones.find((zone) => boundaryIntersectsDangerZone(center, radiusM, zone)) ||
    null
  );
};
