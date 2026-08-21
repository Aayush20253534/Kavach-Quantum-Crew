import { auditListQuerySchema, auditSummaryQuerySchema } from "../../src/modules/audit/audit.validation.js";

describe("Phase 24 audit validation", () => {
  test("coerces bounded audit filters", () => {
    const parsed = auditListQuerySchema.parse({
      actorRole: "SYSTEM_ADMIN",
      action: "INCIDENT_RESOLVED",
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-22T00:00:00.000Z",
      limit: "75",
    });
    expect(parsed.limit).toBe(75);
    expect(parsed.from).toEqual(new Date("2026-08-01T00:00:00.000Z"));
  });

  test("rejects inverted audit time windows", () => {
    expect(auditSummaryQuerySchema.safeParse({
      from: "2026-08-22T00:00:00.000Z",
      to: "2026-08-01T00:00:00.000Z",
    }).success).toBe(false);
  });
});
