import { jest } from "@jest/globals";
import { createIncidentService } from "../../src/modules/incident/incident.service.js";

const baseRepository = () => ({
  findById: jest.fn().mockResolvedValue({ id: "incident-1", status: "OPEN", assignedToId: null }),
  findResponder: jest.fn().mockResolvedValue({ id: "dm-1", responderStatus: "AVAILABLE", maxActiveIncidents: 2 }),
  countResponderActiveIncidents: jest.fn().mockResolvedValue(1),
  assign: jest.fn().mockResolvedValue({ id: "incident-1", assignedToId: "dm-1", assignedToRole: "DISASTER_MANAGER" }),
  createAudit: jest.fn().mockResolvedValue({}),
});
const notifier = { assigned: jest.fn() };
const publisher = { publishIncidentUpdated: jest.fn() };

describe("Phase 11 assignment safeguards", () => {
  test("allows an available responder below capacity", async () => {
    const repository = baseRepository();
    const service = createIncidentService({ repository, notifier, publisher });
    await expect(service.assign({ id: "dm-1", role: "DISASTER_MANAGER" }, "incident-1")).resolves.toMatchObject({ assignedToId: "dm-1" });
  });

  test("rejects an off-duty responder", async () => {
    const repository = baseRepository();
    repository.findResponder.mockResolvedValue({ id: "dm-1", responderStatus: "OFF_DUTY", maxActiveIncidents: 2 });
    const service = createIncidentService({ repository, notifier, publisher });
    await expect(service.assign({ id: "dm-1", role: "DISASTER_MANAGER" }, "incident-1")).rejects.toMatchObject({ code: "RESPONDER_NOT_AVAILABLE" });
  });

  test("rejects an available responder at capacity", async () => {
    const repository = baseRepository();
    repository.countResponderActiveIncidents.mockResolvedValue(2);
    const service = createIncidentService({ repository, notifier, publisher });
    await expect(service.assign({ id: "dm-1", role: "DISASTER_MANAGER" }, "incident-1")).rejects.toMatchObject({ code: "RESPONDER_AT_CAPACITY" });
  });
});
