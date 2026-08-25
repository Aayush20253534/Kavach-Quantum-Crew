import { jest } from "@jest/globals";
import { createHazardService } from "../../src/modules/hazard/hazard.service.js";

const tourist = { id: "11111111-1111-4111-8111-111111111111", role: "TOURIST" };
const manager = { id: "22222222-2222-4222-8222-222222222222", role: "DISASTER_MANAGER" };
const base = { id: "33333333-3333-4333-8333-333333333333", reporterId: tourist.id, reporterRole: "TOURIST", type: "FLOOD", severity: "HIGH", status: "PENDING", title: "Flood", description: "Road flooding", latitude: 27.7, longitude: 85.3 };

const setup = (overrides = {}) => {
  const repository = {
    create: jest.fn().mockResolvedValue(base),
    findById: jest.fn().mockResolvedValue(base),
    list: jest.fn().mockResolvedValue([]),
    nearby: jest.fn().mockResolvedValue([]),
    moderate: jest.fn().mockImplementation(async (_id, data) => ({ ...base, ...data })),
    createAudit: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  const publisher = { publishHazardCreated: jest.fn(), publishHazardUpdated: jest.fn() };
  return { repository, publisher, service: createHazardService({ repository, publisher, clock: () => new Date("2026-08-21T18:00:00Z") }) };
};

describe("Phase 12 hazard service", () => {
  test("allows a tourist to report a pending hazard", async () => {
    const { service, repository, publisher } = setup();
    await service.create(tourist, { type: "FLOOD", severity: "HIGH", title: "Flood", description: "Road flooding", latitude: 27.7, longitude: 85.3 });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ reporterId: tourist.id, type: "FLOOD" }));
    expect(publisher.publishHazardCreated).toHaveBeenCalledWith(base);
  });

  test("prevents non tourists from submitting hazards", async () => {
    const { service } = setup();
    await expect(service.create(manager, { type: "FLOOD", severity: "HIGH", title: "Flood", description: "Road flooding", latitude: 27.7, longitude: 85.3 })).rejects.toMatchObject({ code: "HAZARD_REPORT_FORBIDDEN" });
  });

  test("allows disaster management to verify a pending hazard", async () => {
    const { service, repository, publisher } = setup();
    const result = await service.verify(manager, base.id, "Confirmed by field team");
    expect(result.status).toBe("VERIFIED");
    expect(repository.createAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "HAZARD_VERIFIED" }));
    expect(publisher.publishHazardUpdated).toHaveBeenCalled();
  });

  test("rejects invalid moderation transitions", async () => {
    const { service } = setup({ findById: jest.fn().mockResolvedValue({ ...base, status: "REJECTED" }) });
    await expect(service.verify(manager, base.id)).rejects.toMatchObject({ code: "HAZARD_STATE_CONFLICT" });
  });

  test("returns only nearby verified hazards within the exact radius", async () => {
    const { service } = setup({ nearby: jest.fn().mockResolvedValue([{ ...base, status: "VERIFIED", latitude: 27.7005, longitude: 85.3005 }, { ...base, id: "44444444-4444-4444-8444-444444444444", status: "VERIFIED", latitude: 28.5, longitude: 86.5 }]) });
    const result = await service.nearby(tourist, { latitude: 27.7, longitude: 85.3, radiusKm: 10, limit: 50 });
    expect(result).toHaveLength(1);
    expect(result[0].distanceKm).toBeLessThan(1);
  });
});
