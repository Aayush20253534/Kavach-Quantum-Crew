import { jest } from "@jest/globals";

import { validate } from "../../src/middleware/validate.middleware.js";
import { touristDashboardQuerySchema } from "../../src/modules/dashboard/dashboard.validation.js";

describe("Express 5 query validation", () => {
  test("validates and exposes coerced query values without assigning to the prototype getter", () => {
    const request = {};
    Object.defineProperty(request, "query", {
      configurable: true,
      get() {
        return {
          latitude: "25.4954",
          longitude: "81.8692",
        };
      },
    });

    const next = jest.fn();

    validate({ query: touristDashboardQuerySchema })(request, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(request.query).toEqual({
      latitude: 25.4954,
      longitude: 81.8692,
    });
  });
});
