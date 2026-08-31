import { jest } from "@jest/globals";
import { createSignalLossService } from "../../src/modules/signal-loss/signal-loss.service.js";

const trip = {
  id: "11111111-1111-4111-8111-111111111111",
  touristId: "22222222-2222-4222-8222-222222222222",
  status: "ACTIVE",
  tripType: "SOLO",
  locationName: "Prayagraj",
  startedAt: new Date("2026-08-29T10:00:00.000Z"),
  plannedStartAt: new Date("2026-08-29T10:00:00.000Z"),
  tourist: { id: "22222222-2222-4222-8222-222222222222", name: "Solo Tourist", email: "solo@example.com", phone: "+919999999999" },
};

const baseRepository = () => ({
  listActiveGroupTrips: jest.fn().mockResolvedValue([]),
  listActiveSoloTrips: jest.fn().mockResolvedValue([trip]),
  findLatest: jest.fn().mockResolvedValue({ capturedAt: new Date("2026-08-29T10:00:00.000Z") }),
  findOpenSoloAlert: jest.fn(),
  createSafetyAlert: jest.fn(),
  updateSafetyAlert: jest.fn(),
  findIncidentByAlert: jest.fn().mockResolvedValue(null),
  createAudit: jest.fn().mockResolvedValue({}),
});

test("emails a solo tourist after ten minutes without opening a Disaster Management incident yet", async () => {
  const now = new Date("2026-08-29T10:10:30.000Z");
  const alert = {
    id: "33333333-3333-4333-8333-333333333333",
    tripId: trip.id,
    userId: trip.touristId,
    type: "TRACKING_INTERRUPTION",
    level: "WARNING",
    details: { soloMissingCheck: true, responseDeadlineAt: "2026-08-29T10:15:30.000Z", escalatedToDisasterManagement: false },
  };
  const repository = baseRepository();
  repository.findOpenSoloAlert.mockResolvedValue(null);
  repository.createSafetyAlert.mockResolvedValue(alert);
  const notifier = { soloSignalLossPrompt: jest.fn().mockResolvedValue(undefined) };
  const incidentReporter = { ingestSafetyAlert: jest.fn() };
  const service = createSignalLossService({ repository, notifier, incidentReporter, clock: () => now });

  const result = await service.sweep();

  expect(result.soloPrompted).toBe(1);
  expect(repository.createSafetyAlert).toHaveBeenCalledWith(expect.objectContaining({ sourceId: "solo-signal-loss", level: "WARNING" }));
  expect(notifier.soloSignalLossPrompt).toHaveBeenCalledWith({ alert, trip, tourist: trip.tourist });
  expect(incidentReporter.ingestSafetyAlert).not.toHaveBeenCalled();
});

test("creates a normal incident when the solo tourist misses the confirmation deadline", async () => {
  const now = new Date("2026-08-29T10:16:00.000Z");
  const alert = {
    id: "33333333-3333-4333-8333-333333333333",
    tripId: trip.id,
    userId: trip.touristId,
    type: "TRACKING_INTERRUPTION",
    level: "WARNING",
    message: "confirm safety",
    details: { soloMissingCheck: true, responseDeadlineAt: "2026-08-29T10:15:30.000Z", escalatedToDisasterManagement: false },
  };
  const escalatedAlert = { ...alert, level: "DANGER", details: { ...alert.details, escalatedToDisasterManagement: true } };
  const incident = { id: "44444444-4444-4444-8444-444444444444", tripId: trip.id, userId: trip.touristId };
  const repository = baseRepository();
  repository.findOpenSoloAlert.mockResolvedValue(alert);
  repository.updateSafetyAlert.mockResolvedValue(escalatedAlert);
  const incidentReporter = { ingestSafetyAlert: jest.fn().mockResolvedValue(incident) };
  const service = createSignalLossService({ repository, notifier: {}, incidentReporter, clock: () => now });

  const result = await service.sweep();

  expect(result.soloEscalated).toBe(1);
  expect(repository.updateSafetyAlert).toHaveBeenCalledWith(alert.id, expect.objectContaining({ level: "DANGER" }));
  expect(incidentReporter.ingestSafetyAlert).toHaveBeenCalledWith(escalatedAlert);
  expect(repository.createAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "SOLO_SIGNAL_LOSS_ESCALATED", metadata: expect.objectContaining({ incidentId: incident.id }) }));
});

test("lets the solo tourist confirm safety before escalation", async () => {
  const now = new Date("2026-08-29T10:12:00.000Z");
  const alert = {
    id: "33333333-3333-4333-8333-333333333333",
    tripId: trip.id,
    userId: trip.touristId,
    type: "TRACKING_INTERRUPTION",
    status: "OPEN",
    details: { soloMissingCheck: true, escalatedToDisasterManagement: false },
  };
  const repository = baseRepository();
  repository.findSoloAlertForTourist = jest.fn().mockResolvedValue(alert);
  repository.findTripStatus = jest.fn().mockResolvedValue({ status: "ACTIVE", tripType: "SOLO", touristId: trip.touristId });
  repository.updateSafetyAlert.mockResolvedValue({ ...alert, status: "RESOLVED" });
  const incidentReporter = { ingestSafetyAlert: jest.fn() };
  const service = createSignalLossService({ repository, notifier: {}, incidentReporter, clock: () => now });

  const result = await service.respondSolo(trip.touristId, alert.id, "I_AM_SAFE");

  expect(result.status).toBe("RESOLVED");
  expect(incidentReporter.ingestSafetyAlert).not.toHaveBeenCalled();
  expect(repository.createAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "SOLO_SIGNAL_LOSS_CONFIRMED_SAFE" }));
});
