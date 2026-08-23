import { jest } from "@jest/globals";

import { createDisasterManagementRepository } from "../../src/modules/disaster-management/disaster-management.repository.js";

describe("Disaster Management jurisdiction filtering", () => {
  test("filters incidents through tripId instead of a non-existent Incident.trip relation", async () => {
    const db = {
      trip: {
        findMany: jest.fn().mockResolvedValue([{ id: "trip-1" }, { id: "trip-2" }]),
      },
      incident: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const repository = createDisasterManagementRepository({ db });

    await repository.listIncidentQueue({
      jurisdiction: "Prayagraj",
      scope: "ALL",
      actorId: "dm-1",
      limit: 50,
    });

    expect(db.incident.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tripId: { in: ["trip-1", "trip-2"] },
        }),
      }),
    );

    const where = db.incident.findMany.mock.calls[0][0].where;
    expect(where).not.toHaveProperty("trip");
  });
});
