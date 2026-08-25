import { EventEmitter } from "node:events";
import { jest } from "@jest/globals";
import { createObservabilityMiddleware } from "../../src/middleware/observability.middleware.js";

describe("Phase 24 observability middleware", () => {
  test("records one completed request even when finish and close both fire", () => {
    const registry = {
      requestStarted: jest.fn().mockReturnValue(100),
      requestFinished: jest.fn(),
    };
    const middleware = createObservabilityMiddleware({ registry });
    const response = new EventEmitter();
    response.statusCode = 204;
    const next = jest.fn();
    middleware({ method: "POST" }, response, next);
    response.emit("finish");
    response.emit("close");
    expect(next).toHaveBeenCalledTimes(1);
    expect(registry.requestFinished).toHaveBeenCalledTimes(1);
    expect(registry.requestFinished).toHaveBeenCalledWith({
      method: "POST",
      statusCode: 204,
      startedAt: 100,
    });
  });
});
