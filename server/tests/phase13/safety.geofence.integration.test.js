import { jest } from "@jest/globals";
import { createSafetyService } from "../../src/modules/safety/safety.service.js";

const userId = "11111111-1111-4111-8111-111111111111";
const tripId = "22222222-2222-4222-8222-222222222222";
const zoneId = "33333333-3333-4333-8333-333333333333";

const trip = { id: tripId, touristId: userId, status: "ACTIVE", group: null };

describe("Phase 13 safety geofence integration", () => {
  test("creates a risk alert when a trusted location enters a polygon", async () => {
    const repository = {
      findTripContext: jest.fn().mockResolvedValue(trip),
      findDueCheckIns: jest.fn().mockResolvedValue([]),
      listActiveZones: jest.fn().mockResolvedValue([{ id: zoneId, name: "Restricted", type: "RISK", severity: "CRITICAL", geometryType: "POLYGON", active: true, polygon: [{ latitude: 27, longitude: 85 }, { latitude: 27, longitude: 86 }, { latitude: 28, longitude: 85 }] }]),
      findLastGeofenceEvent: jest.fn().mockResolvedValue(null),
      createGeofenceEvent: jest.fn().mockResolvedValue({ type: "ENTER" }),
      findOpenAlert: jest.fn().mockResolvedValue(null),
      createAlert: jest.fn().mockResolvedValue({ id: "44444444-4444-4444-8444-444444444444", tripId, userId, type: "RISK_ZONE_ENTRY", level: "DANGER" }),
      resolveOpenAlert: jest.fn(),
    };
    const incidentReporter = { ingestSafetyAlert: jest.fn().mockResolvedValue({}) };
    const service = createSafetyService({ repository, incidentReporter });
    const result = await service.evaluateLocation({ tripId, userId, latitude: 27.2, longitude: 85.2, capturedAt: new Date() });
    expect(result.level).toBe("DANGER");
    expect(repository.createAlert).toHaveBeenCalledWith(expect.objectContaining({ sourceId: zoneId, level: "DANGER" }));
    expect(incidentReporter.ingestSafetyAlert).toHaveBeenCalled();
  });
});
