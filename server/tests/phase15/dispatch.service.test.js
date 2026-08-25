import { jest } from "@jest/globals";
import { createDispatchService } from "../../src/modules/dispatch/dispatch.service.js";

const manager = { id: "11111111-1111-4111-8111-111111111111", role: "DISASTER_MANAGER" };
const admin = { id: "22222222-2222-4222-8222-222222222222", role: "SYSTEM_ADMIN" };
const incident = { id: "33333333-3333-4333-8333-333333333333", status: "OPEN", latitude: 21.1458, longitude: 79.0882, sourceType: "SOS" };
const unit = { id: "44444444-4444-4444-8444-444444444444", name: "Ambulance 1", type: "AMBULANCE", status: "AVAILABLE", latitude: 21.146, longitude: 79.089 };
const requested = { id: "55555555-5555-4555-8555-555555555555", incidentId: incident.id, requestedUnitType: "AMBULANCE", unitId: null, status: "REQUESTED" };

const setup = (overrides = {}) => {
  const repository = {
    createUnit: jest.fn().mockResolvedValue(unit), listUnits: jest.fn().mockResolvedValue([unit]), listAvailableUnitsByType: jest.fn().mockResolvedValue([unit]), findUnit: jest.fn().mockResolvedValue(unit), updateUnit: jest.fn().mockImplementation(async (_id,data)=>({ ...unit, ...data })),
    findIncident: jest.fn().mockResolvedValue(incident), createDispatch: jest.fn().mockResolvedValue(requested), findDispatch: jest.fn().mockResolvedValue(requested), listForIncident: jest.fn().mockResolvedValue([requested]), updateDispatch: jest.fn().mockImplementation(async (_id,data)=>({ ...requested, ...data })), createEvent: jest.fn().mockResolvedValue({}), createAudit: jest.fn().mockResolvedValue({}), ...overrides,
  };
  const publisher = { publishDispatchUpdated: jest.fn(), publishEmergencyUnitUpdated: jest.fn() };
  const emailer = { dispatchAssigned: jest.fn().mockResolvedValue({ delivered: true }) };
  return { repository, publisher, emailer, service: createDispatchService({ repository, publisher, emailer, clock: () => new Date("2026-08-21T18:00:00Z") }) };
};

describe("Phase 15 emergency dispatch", () => {
  test("creates an unassigned dispatch request", async () => {
    const { service, repository } = setup();
    await service.create(manager, incident.id, { unitType: "AMBULANCE" });
    expect(repository.createDispatch).toHaveBeenCalledWith(expect.objectContaining({ status: "REQUESTED", requestedUnitType: "AMBULANCE" }));
  });
  test("assigns an available matching unit", async () => {
    const { service, repository } = setup();
    const result = await service.assign(manager, requested.id, { unitId: unit.id });
    expect(result.status).toBe("ASSIGNED");
    expect(repository.updateUnit).toHaveBeenCalledWith(unit.id, { status: "DISPATCHED" });
  });
  test("rejects unavailable units", async () => {
    const { service } = setup({ findUnit: jest.fn().mockResolvedValue({ ...unit, status: "OUT_OF_SERVICE" }) });
    await expect(service.assign(manager, requested.id, { unitId: unit.id })).rejects.toMatchObject({ code: "EMERGENCY_UNIT_UNAVAILABLE" });
  });
  test("enforces sequential lifecycle", async () => {
    const assigned = { ...requested, unitId: unit.id, status: "ASSIGNED" };
    const { service } = setup({ findDispatch: jest.fn().mockResolvedValue(assigned), updateDispatch: jest.fn().mockImplementation(async (_id,data)=>({ ...assigned, ...data })) });
    await expect(service.transition(manager, assigned.id, "ON_SCENE")).rejects.toMatchObject({ code: "DISPATCH_INVALID_TRANSITION" });
    await expect(service.transition(manager, assigned.id, "DISPATCHED")).resolves.toMatchObject({ status: "DISPATCHED" });
  });
  test("emails the fleet when a dispatch is auto assigned", async () => {
    const serviceAccount = { id: "77777777-7777-4777-8777-777777777777", email: "ambulance@example.com", name: "City Hospital", serviceType: "AMBULANCE" };
    const assignedUnit = { ...unit, serviceAccount };
    const { service, emailer } = setup({
      findUnit: jest.fn().mockResolvedValue(assignedUnit),
      listAvailableUnitsByType: jest.fn().mockResolvedValue([assignedUnit]),
      createDispatch: jest.fn().mockImplementation(async (data) => ({ ...requested, ...data, incident, unit: assignedUnit })),
    });
    await service.autoAssign(manager, incident.id, "ambulance", {});
    expect(emailer.dispatchAssigned).toHaveBeenCalledWith(expect.objectContaining({
      account: serviceAccount,
      autoAssigned: true,
      dispatch: expect.objectContaining({ incidentId: incident.id }),
    }));
  });

  test("only system admin manages emergency unit inventory", async () => {
    const { service } = setup();
    await expect(service.createUnit(manager, { name: "A", type: "AMBULANCE" })).rejects.toMatchObject({ code: "UNIT_MANAGE_FORBIDDEN" });
    await expect(service.createUnit(admin, { name: "Ambulance 1", type: "AMBULANCE" })).resolves.toEqual(unit);
  });
  test("auto assigns the nearest available unit for the requested service", async () => {
    const farther = { ...unit, id: "66666666-6666-4666-8666-666666666666", latitude: 21.3, longitude: 79.3 };
    const { service, repository } = setup({
      listAvailableUnitsByType: jest.fn().mockResolvedValue([farther, unit]),
      createDispatch: jest.fn().mockImplementation(async (data) => ({ ...requested, ...data })),
    });
    const result = await service.autoAssign(manager, incident.id, "ambulance", {});
    expect(result.unitId).toBe(unit.id);
    expect(repository.updateUnit).toHaveBeenCalledWith(unit.id, { status: "DISPATCHED" });
  });
});
