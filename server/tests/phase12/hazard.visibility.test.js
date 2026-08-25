import { jest } from "@jest/globals";
import { createHazardService } from "../../src/modules/hazard/hazard.service.js";

const outsider = { id: "11111111-1111-4111-8111-111111111111", role: "TOURIST" };
const owner = { id: "22222222-2222-4222-8222-222222222222", role: "TOURIST" };
const pending = { id: "33333333-3333-4333-8333-333333333333", reporterId: owner.id, reporterRole: "TOURIST", status: "PENDING" };

describe("Phase 12 hazard visibility", () => {
  test("hides another tourist's unverified report", async () => {
    const repository = { findById: jest.fn().mockResolvedValue(pending) };
    const service = createHazardService({ repository, publisher: {} });
    await expect(service.get(outsider, pending.id)).rejects.toMatchObject({ code: "HAZARD_NOT_FOUND" });
  });

  test("allows reporter to inspect their pending report", async () => {
    const repository = { findById: jest.fn().mockResolvedValue(pending) };
    const service = createHazardService({ repository, publisher: {} });
    await expect(service.get(owner, pending.id)).resolves.toEqual(pending);
  });
});
