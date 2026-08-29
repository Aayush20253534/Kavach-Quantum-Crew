import { jest } from "@jest/globals";

import { cacheGetOrSet } from "../../src/common/cache/cache.js";
import { createAnalyticsService } from "../../src/modules/analytics/analytics.service.js";
import { createJurisdictionPlacesService } from "../../src/modules/disaster-management/jurisdiction-places.service.js";
import { createRiskZoneService } from "../../src/modules/risk-zone/risk-zone.service.js";

const manager = { id: "dm-1", role: "DISASTER_MANAGER" };

const memoryClient = () => {
  const values = new Map();
  return {
    get: jest.fn(async (key) => values.get(key) ?? null),
    set: jest.fn(async (key, value) => { values.set(key, value); return "OK"; }),
    del: jest.fn(async (...keys) => { keys.forEach((key) => values.delete(key)); return keys.length; }),
  };
};

describe("Redis caching", () => {
  test("coalesces concurrent misses for the same key", async () => {
    const client = memoryClient();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const fetcher = jest.fn(async () => {
      await gate;
      return { value: 42 };
    });

    const first = cacheGetOrSet({ key: "test:coalesce", ttlSeconds: 30, fetcher, client });
    const second = cacheGetOrSet({ key: "test:coalesce", ttlSeconds: 30, fetcher, client });
    release();

    await expect(Promise.all([first, second])).resolves.toEqual([{ value: 42 }, { value: 42 }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(client.set).toHaveBeenCalledTimes(1);
  });

  test("caches Google Places lookups by normalized jurisdiction", async () => {
    const cache = jest.fn(async ({ fetcher }) => fetcher());
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({ places: [] }),
    }));
    const service = createJurisdictionPlacesService({
      apiKey: "maps-key",
      fetchImpl,
      cache,
    });

    await service.lookup("  Prayagraj  ");

    expect(cache).toHaveBeenCalledWith(expect.objectContaining({
      key: "places:jurisdiction:prayagraj",
    }));
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  test("caches analytics aggregates instead of live operational endpoints", async () => {
    const cache = jest.fn(async ({ fetcher }) => fetcher());
    const repository = {
      overview: jest.fn().mockResolvedValue({ tourists: 10 }),
    };
    const service = createAnalyticsService({ repository, cache });

    await service.overview({ id: "admin", role: "SYSTEM_ADMIN" }, {});

    expect(cache).toHaveBeenCalledWith(expect.objectContaining({
      key: "analytics:overview:all:now",
    }));
    expect(repository.overview).toHaveBeenCalledTimes(1);
  });

  test("invalidates all safety-zone caches after a risk-zone mutation", async () => {
    const zone = {
      id: "zone-1",
      type: "RISK",
      severity: "HIGH",
      geometryType: "CIRCLE",
      latitude: 25.4,
      longitude: 81.8,
      radiusM: 1000,
      active: true,
      status: "ACTIVE",
    };
    const repository = {
      findById: jest.fn().mockResolvedValue(zone),
      update: jest.fn().mockResolvedValue({ ...zone, active: false }),
      createAudit: jest.fn().mockResolvedValue({}),
    };
    const invalidateZoneCache = jest.fn().mockResolvedValue(undefined);
    const publisher = { publishRiskZoneUpdated: jest.fn() };
    const service = createRiskZoneService({ repository, invalidateZoneCache, publisher });

    await service.setActive(manager, zone.id, false);

    expect(invalidateZoneCache).toHaveBeenCalledTimes(1);
    expect(publisher.publishRiskZoneUpdated).toHaveBeenCalled();
  });
});
