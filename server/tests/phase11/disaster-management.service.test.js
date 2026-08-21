import { jest } from "@jest/globals";
import { createDisasterManagementService } from "../../src/modules/disaster-management/disaster-management.service.js";

const responder = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Responder One",
  status: "ACTIVE",
  responderStatus: "AVAILABLE",
  maxActiveIncidents: 3,
};

const createRepository = () => ({
  findResponderById: jest.fn().mockResolvedValue(responder),
  countActiveAssignments: jest.fn().mockResolvedValue(1),
  listResponders: jest.fn().mockResolvedValue([{ ...responder, activeIncidentCount: 1, atCapacity: false }]),
  updateResponderStatus: jest.fn().mockImplementation(async (id, status, now) => ({ ...responder, id, responderStatus: status, statusChangedAt: now })),
  listAssignedIncidents: jest.fn().mockResolvedValue([{ id: "incident-1" }]),
  listIncidentQueue: jest.fn().mockResolvedValue([{ id: "incident-2" }]),
  dashboard: jest.fn().mockResolvedValue({ openIncidents: 2, criticalIncidents: 1, unassignedIncidents: 1, myActiveIncidents: 1, resolvedToday: 3, availableResponders: 4 }),
  createAudit: jest.fn().mockResolvedValue({}),
});

const incidents = { get: jest.fn(), acknowledge: jest.fn(), startResponse: jest.fn(), resolve: jest.fn() };
const publisher = { publishResponderStatus: jest.fn() };
const actor = { id: responder.id, role: "DISASTER_MANAGER" };

describe("Phase 11 disaster management service", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns responder profile with active workload", async () => {
    const repository = createRepository();
    const service = createDisasterManagementService({ repository, incidents, publisher });
    await expect(service.me(actor)).resolves.toMatchObject({ id: responder.id, activeIncidentCount: 1, atCapacity: false });
  });

  test("updates own responder status, audits, and publishes realtime state", async () => {
    const repository = createRepository();
    const now = new Date("2026-08-21T18:00:00.000Z");
    const service = createDisasterManagementService({ repository, incidents, publisher, clock: () => now });

    const updated = await service.updateMyStatus(actor, "OFF_DUTY");

    expect(updated.responderStatus).toBe("OFF_DUTY");
    expect(repository.createAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "RESPONDER_STATUS_CHANGED", entityId: responder.id }));
    expect(publisher.publishResponderStatus).toHaveBeenCalledWith(updated);
  });

  test("returns personal incident assignments", async () => {
    const repository = createRepository();
    const service = createDisasterManagementService({ repository, incidents, publisher });
    const result = await service.myIncidents(actor, { limit: 50 });
    expect(result).toEqual([{ id: "incident-1" }]);
    expect(repository.listAssignedIncidents).toHaveBeenCalledWith(actor.id, { limit: 50 });
  });

  test("rejects personal responder profile for system admin", async () => {
    const repository = createRepository();
    const service = createDisasterManagementService({ repository, incidents, publisher });
    await expect(service.me({ id: "admin", role: "SYSTEM_ADMIN" })).rejects.toMatchObject({ code: "RESPONDER_PROFILE_FORBIDDEN" });
  });

  test("supports unassigned emergency queue scope", async () => {
    const repository = createRepository();
    const service = createDisasterManagementService({ repository, incidents, publisher });
    await service.queue(actor, { scope: "UNASSIGNED", limit: 20 });
    expect(repository.listIncidentQueue).toHaveBeenCalledWith(expect.objectContaining({ scope: "UNASSIGNED", actorId: actor.id }));
  });
});
