import { haversineDistanceM } from "./geo.js";

const pointOnSegment = (p, a, b, epsilon = 1e-10) => {
  const cross = (p.longitude - a.longitude) * (b.latitude - a.latitude) -
    (p.latitude - a.latitude) * (b.longitude - a.longitude);
  if (Math.abs(cross) > epsilon) return false;
  const dot = (p.longitude - a.longitude) * (b.longitude - a.longitude) +
    (p.latitude - a.latitude) * (b.latitude - a.latitude);
  if (dot < -epsilon) return false;
  const lengthSq = (b.longitude - a.longitude) ** 2 + (b.latitude - a.latitude) ** 2;
  return dot <= lengthSq + epsilon;
};

export const pointInPolygon = (point, polygon = []) => {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j];
    const b = polygon[i];
    if (pointOnSegment(point, a, b)) return true;
    const intersects = ((b.latitude > point.latitude) !== (a.latitude > point.latitude)) &&
      (point.longitude < ((a.longitude - b.longitude) * (point.latitude - b.latitude)) /
        (a.latitude - b.latitude) + b.longitude);
    if (intersects) inside = !inside;
  }
  return inside;
};

export const zoneContainsPoint = (zone, point) => {
  const geometryType = zone.geometryType ?? "CIRCLE";

  if (geometryType === "POLYGON") {
    return pointInPolygon(point, zone.polygon ?? []);
  }

  if (
    (zone.latitude === null || zone.latitude === undefined) ||
    (zone.longitude === null || zone.longitude === undefined) ||
    (zone.radiusM === null || zone.radiusM === undefined)
  ) {
    return false;
  }

  return haversineDistanceM(point, { latitude: zone.latitude, longitude: zone.longitude }) <= zone.radiusM;
};

const pointToSegmentDistanceM = (point, a, b) => {
  const latScale = 111320;
  const lngScale = 111320 * Math.cos((point.latitude * Math.PI) / 180);

  const ax = (a.longitude - point.longitude) * lngScale;
  const ay = (a.latitude - point.latitude) * latScale;
  const bx = (b.longitude - point.longitude) * lngScale;
  const by = (b.latitude - point.latitude) * latScale;

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

export const zoneIntersectsCircle = (zone, center, radiusM = 0) => {
  const radius = Math.max(0, Number(radiusM) || 0);
  const geometryType = zone.geometryType ?? "CIRCLE";

  if (geometryType === "POLYGON") {
    const polygon = Array.isArray(zone.polygon) ? zone.polygon : [];
    if (polygon.length < 3) return false;
    if (pointInPolygon(center, polygon)) return true;

    return polygon.some((point, index) =>
      pointToSegmentDistanceM(
        center,
        point,
        polygon[(index + 1) % polygon.length],
      ) <= radius
    );
  }

  if (
    zone.latitude === null || zone.latitude === undefined ||
    zone.longitude === null || zone.longitude === undefined ||
    zone.radiusM === null || zone.radiusM === undefined
  ) {
    return false;
  }

  return haversineDistanceM(center, {
    latitude: zone.latitude,
    longitude: zone.longitude,
  }) <= Number(zone.radiusM) + radius;
};

export const zoneIsEffective = (zone, now = new Date()) => {
  if (zone.active === false) return false;
  if (zone.validFrom && new Date(zone.validFrom) > now) return false;
  if (zone.validUntil && new Date(zone.validUntil) < now) return false;
  return true;
};
