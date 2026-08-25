import { jest } from "@jest/globals";

import { createAnalyticsService } from "../../src/modules/analytics/analytics.service.js";

describe("Phase 19 analytics authorization", () => {
  test("allows disaster managers to read analytics", async () => {
    const repository = {
      overview: jest.fn().mockResolvedValue({ activeTrips: 1 }),
    };

    const service = createAnalyticsService({ repository });

    await expect(
      service.overview(
        { id: "dm-1", role: "DISASTER_MANAGER" },
        {},
      ),
    ).resolves.toEqual({ activeTrips: 1 });
  });

  test("allows system administrators to read analytics", async () => {
    const repository = {
      overview: jest.fn().mockResolvedValue({ openIncidents: 2 }),
    };

    const service = createAnalyticsService({ repository });

    await expect(
      service.overview(
        { id: "admin-1", role: "SYSTEM_ADMIN" },
        {},
      ),
    ).resolves.toEqual({ openIncidents: 2 });
  });

  test("rejects tourists before querying analytics repositories", () => {
    const repository = {
      overview: jest.fn(),
    };

    const service = createAnalyticsService({ repository });

    expect(() =>
      service.overview(
        { id: "tourist-1", role: "TOURIST" },
        {},
      ),
    ).toThrow("Analytics access requires emergency staff");

    expect(repository.overview).not.toHaveBeenCalled();
  });
});
