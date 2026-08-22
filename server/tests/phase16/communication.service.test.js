import { jest } from "@jest/globals";

import { createCommunicationService } from "../../src/modules/communication/communication.service.js";

const tourist = { id: "11111111-1111-4111-8111-111111111111", role: "TOURIST" };
const outsider = { id: "22222222-2222-4222-8222-222222222222", role: "TOURIST" };
const manager = { id: "33333333-3333-4333-8333-333333333333", role: "DISASTER_MANAGER" };
const incident = {
  id: "44444444-4444-4444-8444-444444444444",
  tripId: "55555555-5555-4555-8555-555555555555",
  userId: tourist.id,
  status: "IN_PROGRESS",
};
const message = {
  id: "66666666-6666-4666-8666-666666666666",
  incidentId: incident.id,
  senderId: tourist.id,
  senderRole: "TOURIST",
  body: "I can see the rescue vehicle.",
  createdAt: new Date("2026-08-21T18:00:00Z"),
};

const setup = (overrides = {}) => {
  const repository = {
    findIncident: jest.fn().mockResolvedValue(incident),
    findTripContext: jest.fn().mockResolvedValue(null),
    createMessage: jest.fn().mockResolvedValue(message),
    listMessages: jest.fn().mockResolvedValue([message]),
    createAudit: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  const publisher = { publishIncidentMessage: jest.fn() };
  return {
    repository,
    publisher,
    service: createCommunicationService({ repository, publisher }),
  };
};

describe("Phase 16 incident communication", () => {
  test("allows the affected tourist to send an incident message", async () => {
    const { service, repository, publisher } = setup();
    const result = await service.send(tourist, incident.id, { message: message.body });

    expect(result).toEqual(message);
    expect(repository.createMessage).toHaveBeenCalledWith(incident.id, tourist, message.body);
    expect(repository.createAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "INCIDENT_MESSAGE_SENT", entityId: message.id }),
    );
    expect(publisher.publishIncidentMessage).toHaveBeenCalledWith(incident, message);
  });

  test("allows emergency staff to participate", async () => {
    const { service, repository } = setup();
    await service.send(manager, incident.id, { message: "Help is approaching." });
    expect(repository.findTripContext).not.toHaveBeenCalled();
    expect(repository.createMessage).toHaveBeenCalled();
  });

  test("hides incident communication from unrelated tourists", async () => {
    const { service } = setup();
    await expect(service.list(outsider, incident.id, { limit: 50 })).rejects.toMatchObject({
      code: "INCIDENT_NOT_FOUND",
    });
  });

  test("allows an active group participant to read messages", async () => {
    const groupTrip = {
      touristId: tourist.id,
      group: { members: [{ userId: outsider.id }] },
    };
    const { service } = setup({ findTripContext: jest.fn().mockResolvedValue(groupTrip) });
    await expect(service.list(outsider, incident.id, { limit: 50 })).resolves.toMatchObject({
      items: [message],
    });
  });

  test("locks new messages after incident resolution", async () => {
    const { service, repository } = setup({
      findIncident: jest.fn().mockResolvedValue({ ...incident, status: "RESOLVED" }),
    });

    await expect(
      service.send(tourist, incident.id, { message: "Thank you." }),
    ).rejects.toMatchObject({ code: "INCIDENT_COMMUNICATION_CLOSED" });
    expect(repository.createMessage).not.toHaveBeenCalled();
  });

  test("returns message history in chronological order with a pagination cursor", async () => {
    const newer = { ...message, id: "77777777-7777-4777-8777-777777777777", createdAt: new Date("2026-08-21T18:01:00Z") };
    const { service } = setup({ listMessages: jest.fn().mockResolvedValue([newer, message]) });

    const result = await service.list(tourist, incident.id, { limit: 2 });
    expect(result.items.map((item) => item.id)).toEqual([message.id, newer.id]);
    expect(result.nextBefore).toEqual(message.createdAt);
  });
});
