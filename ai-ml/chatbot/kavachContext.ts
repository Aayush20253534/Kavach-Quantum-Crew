export interface NearbySafeZone {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  radiusM?: number | null;
  distanceM: number;
}

interface SafetyZoneApiRecord {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  radiusM?: unknown;
  type?: unknown;
  active?: unknown;
}

const NEAREST_SAFE_ZONE_PATTERNS = [
  /\bnearest\s+(?:safe|safety)\s+zone\b/i,
  /\bclosest\s+(?:safe|safety)\s+zone\b/i,
  /\b(?:safe|safety)\s+zone\s+near\s+me\b/i,
  /\bwhere\s+is\s+(?:the\s+)?nearest\s+(?:safe|safety)\s+zone\b/i,
  /\bfind\s+(?:a|the)?\s*(?:nearest|closest)?\s*(?:safe|safety)\s+zone\b/i,
];

export function isNearestSafeZoneIntent(message: string): boolean {
  const normalized = message.trim();
  if (!normalized) return false;
  return NEAREST_SAFE_ZONE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const earthRadiusM = 6_371_000;
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusM * c;
}

function normalizeApiBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

function extractZoneArray(payload: unknown): SafetyZoneApiRecord[] {
  if (Array.isArray(payload)) return payload as SafetyZoneApiRecord[];
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;
  if (Array.isArray(root.data)) return root.data as SafetyZoneApiRecord[];

  if (root.data && typeof root.data === "object") {
    const data = root.data as Record<string, unknown>;
    if (Array.isArray(data.items)) return data.items as SafetyZoneApiRecord[];
    if (Array.isArray(data.zones)) return data.zones as SafetyZoneApiRecord[];
  }

  return [];
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export async function fetchNearestSafeZones(
  accessToken: string,
  location: { latitude: number; longitude: number },
  limit = 3,
): Promise<NearbySafeZone[]> {
  const apiBaseUrl = process.env.KAVACH_API_URL;
  if (!apiBaseUrl) {
    throw new Error("KAVACH_API_URL is not configured");
  }
  if (!accessToken) {
    throw new Error("Access token is required for live safe-zone lookup");
  }
  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    throw new Error("Valid latitude and longitude are required");
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.KAVACH_CONTEXT_TIMEOUT_MS || 5000);
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 5000);

  try {
    const response = await fetch(
      `${normalizeApiBaseUrl(apiBaseUrl)}/safety/zones?type=SAFE&active=true`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Kavach safe-zone lookup failed with HTTP ${response.status}${body ? `: ${body.slice(0, 300)}` : ""}`,
      );
    }

    const payload = await response.json() as unknown;
    const zones = extractZoneArray(payload);

    return zones
      .filter((zone) => zone.type == null || zone.type === "SAFE")
      .filter((zone) => zone.active == null || zone.active === true)
      .map((zone): NearbySafeZone | null => {
        const latitude = asFiniteNumber(zone.latitude);
        const longitude = asFiniteNumber(zone.longitude);
        if (latitude == null || longitude == null) return null;

        const id = typeof zone.id === "string" ? zone.id : "unknown";
        const name = typeof zone.name === "string" && zone.name.trim() ? zone.name : "Safe Zone";
        const description = typeof zone.description === "string" ? zone.description : null;
        const radiusM = asFiniteNumber(zone.radiusM);

        return {
          id,
          name,
          description,
          latitude,
          longitude,
          radiusM,
          distanceM: distanceMeters(location, { latitude, longitude }),
        };
      })
      .filter((zone): zone is NearbySafeZone => zone !== null)
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, Math.max(1, Math.min(limit, 10)));
  } finally {
    clearTimeout(timeout);
  }
}
