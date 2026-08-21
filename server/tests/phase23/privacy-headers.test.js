import { jest } from "@jest/globals";

import { apiPrivacyHeadersMiddleware } from "../../src/middleware/requestSecurity.middleware.js";

describe("Phase 23 API privacy headers", () => {
  test("prevents authenticated API responses from being cached", () => {
    const response = { setHeader: jest.fn() };
    const next = jest.fn();

    apiPrivacyHeadersMiddleware({}, response, next);

    expect(response.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(response.setHeader).toHaveBeenCalledWith("Pragma", "no-cache");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
