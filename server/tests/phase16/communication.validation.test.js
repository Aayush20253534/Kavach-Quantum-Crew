import {
  incidentMessageBodySchema,
  incidentMessageListQuerySchema,
} from "../../src/modules/communication/communication.validation.js";

describe("Phase 16 incident communication validation", () => {
  test("trims a valid message", () => {
    expect(incidentMessageBodySchema.parse({ message: "  Need medical help  " })).toEqual({
      message: "Need medical help",
    });
  });

  test("rejects empty messages", () => {
    expect(() => incidentMessageBodySchema.parse({ message: "   " })).toThrow();
  });

  test("caps history page size", () => {
    expect(() => incidentMessageListQuerySchema.parse({ limit: 101 })).toThrow();
    expect(incidentMessageListQuerySchema.parse({})).toMatchObject({ limit: 50 });
  });
});
