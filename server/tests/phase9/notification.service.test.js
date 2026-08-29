import { jest } from "@jest/globals";
import { createNotificationService } from "../../src/modules/notification/notification.service.js";

const repo = () => ({
  createMany: jest.fn().mockResolvedValue({ count: 1 }),
  list: jest.fn().mockResolvedValue([]),
  countUnread: jest.fn().mockResolvedValue(2),
  findOwned: jest.fn(),
  markRead: jest.fn(),
  markAllRead: jest.fn().mockResolvedValue({ count: 3 }),
  listDisasterManagers: jest.fn().mockResolvedValue([{ id: "d1", name: "DM One", email: "dm@example.com" }]),
  findGroupLeader: jest.fn().mockResolvedValue("leader1"),
  findTourist: jest.fn().mockResolvedValue({ id: "u1", name: "Tourist One", email: "tourist@example.com", phone: "+919999999999" }),
});

const emailer = () => ({ incidentCreated: jest.fn().mockResolvedValue([]) });

describe("Phase 9 notifications", () => {
  test("fans out incident notifications and emails Disaster Management", async () => {
    const r = repo();
    const e = emailer();
    const s = createNotificationService({ repository: r, emailer: e });
    const incident = { id: "i1", userId: "u1", tripId: "t1", severity: "CRITICAL", title: "SOS", escalationLevel: 0 };
    await s.incidentCreated(incident);
    expect(r.createMany.mock.calls[0][0]).toHaveLength(3);
    expect(e.incidentCreated).toHaveBeenCalledWith({ recipients: [{ id: "d1", name: "DM One", email: "dm@example.com" }], incident: { ...incident, tourist: { id: "u1", name: "Tourist One", email: "tourist@example.com", phone: "+919999999999" } } });
  });

  test("protects notification ownership", async () => {
    const r = repo();
    r.findOwned.mockResolvedValue(null);
    const s = createNotificationService({ repository: r, emailer: emailer() });
    await expect(s.markRead({ id: "u1", role: "TOURIST" }, "n1")).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
  });
});
