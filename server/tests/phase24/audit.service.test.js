import { jest } from "@jest/globals";
import { createAuditService } from "../../src/modules/audit/audit.service.js";

const admin = { id: "admin-1", role: "SYSTEM_ADMIN" };

describe("Phase 24 audit service", () => {
  test("lists audit events for system admin", async () => {
    const rows = [{ id: "audit-1", action: "INCIDENT_RESOLVED" }];
    const repository = {
      list: jest.fn().mockResolvedValue(rows),
      count: jest.fn().mockResolvedValue(1),
      groupByAction: jest.fn(),
      create: jest.fn(),
    };
    const service = createAuditService({ repository });
    await expect(service.list(admin, { limit: 50 })).resolves.toEqual({ items: rows, total: 1 });
  });

  test("rejects non-admin audit access", async () => {
    const service = createAuditService({ repository: {} });
    await expect(
      service.list({ id: "dm-1", role: "DISASTER_MANAGER" }, {}),
    ).rejects.toThrow("Audit access requires system administrator privileges");
  });

  test("summarizes audit events by action", async () => {
    const repository = {
      groupByAction: jest.fn().mockResolvedValue([
        { action: "SOS_TRIGGERED", _count: { _all: 3 } },
        { action: "INCIDENT_RESOLVED", _count: { _all: 2 } },
      ]),
    };
    const service = createAuditService({ repository });
    await expect(service.summary(admin, {})).resolves.toEqual({
      byAction: { SOS_TRIGGERED: 3, INCIDENT_RESOLVED: 2 },
      total: 5,
    });
  });
});
