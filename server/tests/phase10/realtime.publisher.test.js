import { jest } from "@jest/globals";

import { realtimePublisher, setRealtimeSocketServer } from "../../src/realtime/realtimePublisher.js";

const createIo = () => {
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));
  return { to, emit };
};

describe("Phase 10 realtime publisher", () => {
  afterEach(() => setRealtimeSocketServer(null));

  test("fans incident creation out to tourist and emergency staff rooms", () => {
    const io = createIo();
    setRealtimeSocketServer(io);
    const incident = { id: "inc-1", userId: "tourist-1", status: "OPEN" };

    realtimePublisher.publishIncidentCreated(incident);

    expect(io.to).toHaveBeenCalledWith("incident:inc-1");
    expect(io.to).toHaveBeenCalledWith("account:TOURIST:tourist-1");
    expect(io.to).toHaveBeenCalledWith("role:DISASTER_MANAGER");
    expect(io.to).toHaveBeenCalledWith("role:SYSTEM_ADMIN");
    expect(io.emit).toHaveBeenCalledWith("incident:created", { incident });
  });

  test("targets notification events to the exact account room", () => {
    const io = createIo();
    setRealtimeSocketServer(io);
    const notification = {
      targetAccountId: "dm-1",
      targetRole: "DISASTER_MANAGER",
      type: "INCIDENT_CREATED",
    };

    realtimePublisher.publishNotificationCreated(notification);

    expect(io.to).toHaveBeenCalledWith("account:DISASTER_MANAGER:dm-1");
    expect(io.emit).toHaveBeenCalledWith("notification:created", { notification });
  });
});
