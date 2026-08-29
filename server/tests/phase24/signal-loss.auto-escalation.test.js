import { jest } from "@jest/globals";
import { createSignalLossService } from "../../src/modules/signal-loss/signal-loss.service.js";

const now = new Date("2026-08-29T12:00:00.000Z");
const trip = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "ACTIVE",
  tripType: "GROUP",
  startedAt: new Date(now.getTime() - 30 * 60_000),
  monitoringPolicy: { trackingGapAfterMinutes: 5 },
  group: {
    id: "22222222-2222-4222-8222-222222222222",
    leaderId: "33333333-3333-4333-8333-333333333333",
    leader: { id: "33333333-3333-4333-8333-333333333333", name: "Leader", email: "leader@example.com" },
    members: [
      { userId: "33333333-3333-4333-8333-333333333333", user: { id: "33333333-3333-4333-8333-333333333333", name: "Leader" } },
      { userId: "44444444-4444-4444-8444-444444444444", user: { id: "44444444-4444-4444-8444-444444444444", name: "Missing Member" } },
    ],
  },
};

const signalCase = {
  id: "55555555-5555-4555-8555-555555555555",
  tripId: trip.id,
  groupId: trip.group.id,
  userId: "44444444-4444-4444-8444-444444444444",
  leaderId: trip.group.leaderId,
  status: "WAITING_FOR_LEADER",
  detectedAt: new Date(now.getTime() - 6 * 60_000),
  responseDeadlineAt: new Date(now.getTime() - 60_000),
};

it("creates and reports a normal incident when the leader misses the five-minute response window", async () => {
  const alert = { id: "66666666-6666-4666-8666-666666666666", tripId: trip.id, userId: signalCase.userId, type: "TRACKING_INTERRUPTION", level: "DANGER" };
  const incident = { id: "77777777-7777-4777-8777-777777777777", tripId: trip.id, userId: signalCase.userId, sourceType: "SAFETY_ALERT", severity: "DANGER" };
  const repository = {
    listActiveGroupTrips: jest.fn().mockResolvedValue([trip]),
    findLatest: jest.fn().mockResolvedValue({ capturedAt: new Date(now.getTime() - 20 * 60_000) }),
    findOpenCase: jest.fn().mockResolvedValue(signalCase),
    findAlertByCase: jest.fn().mockResolvedValue(null),
    createSafetyAlert: jest.fn().mockResolvedValue(alert),
    updateCase: jest.fn().mockImplementation(async (_id, data) => ({ ...signalCase, ...data })),
    createAudit: jest.fn().mockResolvedValue({}),
  };
  const incidentReporter = { ingestSafetyAlert: jest.fn().mockResolvedValue(incident) };
  const notifier = { signalLoss: jest.fn() };
  const service = createSignalLossService({ repository, incidentReporter, notifier, clock: () => now });

  const result = await service.sweep();

  expect(result.escalated).toBe(1);
  expect(repository.createSafetyAlert).toHaveBeenCalledWith(expect.objectContaining({ level: "DANGER", sourceId: signalCase.id }));
  expect(incidentReporter.ingestSafetyAlert).toHaveBeenCalledWith(alert);
  expect(repository.updateCase).toHaveBeenCalledWith(signalCase.id, expect.objectContaining({ status: "ESCALATED", incidentId: incident.id }));
  expect(repository.createAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "SIGNAL_LOSS_AUTO_ESCALATED", metadata: expect.objectContaining({ reason: "LEADER_RESPONSE_TIMEOUT", incidentId: incident.id }) }));
});
