import { evidenceListQuerySchema, evidenceUploadBodySchema } from "../../src/modules/evidence/evidence.validation.js";

describe("Phase 17 evidence validation", () => {
  test("accepts exactly one attachment target", () => {
    expect(evidenceUploadBodySchema.parse({ incidentId: "11111111-1111-4111-8111-111111111111" })).toEqual({ incidentId: "11111111-1111-4111-8111-111111111111" });
  });

  test("rejects missing or ambiguous targets", () => {
    expect(() => evidenceUploadBodySchema.parse({})).toThrow();
    expect(() => evidenceUploadBodySchema.parse({ incidentId: "11111111-1111-4111-8111-111111111111", hazardId: "22222222-2222-4222-8222-222222222222" })).toThrow();
  });

  test("caps list size", () => {
    expect(() => evidenceListQuerySchema.parse({ incidentId: "11111111-1111-4111-8111-111111111111", limit: 101 })).toThrow();
  });
});
