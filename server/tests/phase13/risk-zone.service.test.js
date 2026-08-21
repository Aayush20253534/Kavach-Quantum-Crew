import { jest } from "@jest/globals";
import { createRiskZoneService } from "../../src/modules/risk-zone/risk-zone.service.js";

const manager = { id: "11111111-1111-4111-8111-111111111111", role: "DISASTER_MANAGER" };
const tourist = { id: "22222222-2222-4222-8222-222222222222", role: "TOURIST" };
const base = { id: "33333333-3333-4333-8333-333333333333", name: "Risk", type: "RISK", severity: "HIGH", geometryType: "CIRCLE", latitude: 27.7, longitude: 85.3, radiusM: 1000, active: true };

const setup = (overrides = {}) => {
  const repository = {
    create: jest.fn().mockResolvedValue(base),
    findById: jest.fn().mockResolvedValue(base),
    list: jest.fn().mockResolvedValue([base]),
    update: jest.fn().mockImplementation(async (_id, data) => ({ ...base, ...data })),
    createAudit: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  const publisher = { publishRiskZoneUpdated: jest.fn() };
  return { repository, publisher, service: createRiskZoneService({ repository, publisher, clock: () => new Date("2026-08-21T18:00:00Z") }) };
};

describe("Phase 13 risk zone service", () => {
  test("allows disaster management to create zones", async () => {
    const { service, repository } = setup();
    await service.create(manager, { name: "Risk", type: "RISK", severity: "HIGH", geometryType: "CIRCLE", latitude: 27.7, longitude: 85.3, radiusM: 1000 });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ createdById: manager.id }));
  });

  test("prevents tourists from managing zones", async () => {
    const { service } = setup();
    await expect(service.setActive(tourist, base.id, false)).rejects.toMatchObject({ code: "RISK_ZONE_MANAGE_FORBIDDEN" });
  });

  test("evaluates a point against active zones", async () => {
    const { service } = setup();
    await expect(service.evaluate(tourist, { latitude: 27.7005, longitude: 85.3005 })).resolves.toMatchObject({ level: "DANGER" });
  });

  test("supports deactivation", async () => {
    const { service, repository } = setup();
    await service.setActive(manager, base.id, false);
    expect(repository.update).toHaveBeenCalledWith(base.id, { active: false });
  });
});
