import { haversineDistanceM } from "./geo.js";

const toLocalMeters = (origin, point) => {
  const latScale = 111_320;
  const lonScale = latScale * Math.cos((origin.latitude * Math.PI) / 180);
  return {
    x: (point.longitude - origin.longitude) * lonScale,
    y: (point.latitude - origin.latitude) * latScale,
  };
};

const pointToSegmentDistanceM = (point, start, end) => {
  const p = toLocalMeters(start, point);
  const b = toLocalMeters(start, end);
  const lengthSq = b.x ** 2 + b.y ** 2;
  if (lengthSq === 0) return haversineDistanceM(point, start);
  const t = Math.max(0, Math.min(1, (p.x * b.x + p.y * b.y) / lengthSq));
  return Math.hypot(p.x - t * b.x, p.y - t * b.y);
};

export const distanceToRouteM = (point, route = []) => {
  if (!Array.isArray(route) || route.length === 0) return null;
  if (route.length === 1) return haversineDistanceM(point, route[0]);
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 1; index < route.length; index += 1) {
    minimum = Math.min(minimum, pointToSegmentDistanceM(point, route[index - 1], route[index]));
  }
  return minimum;
};

export default distanceToRouteM;
