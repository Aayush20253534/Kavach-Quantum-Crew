import {
  incidentListQuerySchema,
  responderListQuerySchema,
  responderStatusBodySchema,
} from "../../src/modules/disaster-management/disaster-management.validation.js";

describe("Phase 11 disaster management validation", () => {
  test("defaults incident queue scope and page size", () => {
    const parsed = incidentListQuerySchema.parse({});
    expect(parsed).toEqual({ scope: "ALL", limit: 50 });
  });

  test("accepts responder directory filters", () => {
    const parsed = responderListQuerySchema.parse({ status: "AVAILABLE", organization: "NDRF", limit: "25" });
    expect(parsed).toMatchObject({ status: "AVAILABLE", organization: "NDRF", limit: 25 });
  });

  test("rejects unknown responder availability", () => {
    expect(() => responderStatusBodySchema.parse({ status: "SLEEPING" })).toThrow();
  });
});
