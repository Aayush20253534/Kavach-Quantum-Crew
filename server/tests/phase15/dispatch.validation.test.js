import { createDispatchBodySchema, createUnitBodySchema, dispatchTransitionBodySchema } from "../../src/modules/dispatch/dispatch.validation.js";

describe("Phase 15 dispatch validation", () => {
  test("accepts emergency unit creation", () => {
    expect(createUnitBodySchema.parse({ name: "Rescue 4", type: "RESCUE" })).toMatchObject({ type: "RESCUE" });
  });
  test("accepts dispatch request without assigned unit", () => {
    expect(createDispatchBodySchema.parse({ unitType: "AMBULANCE" })).toEqual({ unitType: "AMBULANCE" });
  });
  test("rejects unknown lifecycle status", () => {
    expect(() => dispatchTransitionBodySchema.parse({ status: "FLYING" })).toThrow();
  });
});
