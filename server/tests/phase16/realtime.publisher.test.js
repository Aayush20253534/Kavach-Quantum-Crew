import { jest } from "@jest/globals";

import {
  realtimePublisher,
  setRealtimeSocketServer,
} from "../../src/realtime/realtimePublisher.js";

describe("Phase 16 realtime incident communication", () => {
  test("publishes messages to the incident realtime channel", () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    setRealtimeSocketServer({ to });

    const incident = { id: "inc-1", userId: "tourist-1" };
    const message = { id: "msg-1", incidentId: "inc-1", body: "Status update" };

    realtimePublisher.publishIncidentMessage(incident, message);

    expect(to).toHaveBeenCalledWith("incident:inc-1");
    expect(emit).toHaveBeenCalledWith(
      "incident:message",
      expect.objectContaining({ incident, message }),
    );

    setRealtimeSocketServer(null);
  });
});
