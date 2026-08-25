import { createTestApp } from "../helpers/createTestApp.js";
import { request } from "../helpers/request.js";
import { environment } from "../../src/config/environment.js";
import { createApiRateLimiter } from "../../src/middleware/rateLimiter.middleware.js";

describe("Phase 0 HTTP application", () => {
  test("serves a friendly service document at the root path", async () => {
    const response = await request(createTestApp()).get("/").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "Smart Tourist Safety backend is running",
      data: {
        service: "smart-tourist-safety-backend-test",
        api: "/api/v1",
        health: "/health",
        readiness: "/health/ready",
      },
    });
    expect(response.body.requestId).toEqual(expect.any(String));
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  test("returns liveness in the standard response envelope", async () => {
    const response = await request(createTestApp()).get("/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "Service is alive",
      data: { status: "ok" },
    });
    expect(response.body.requestId).toEqual(expect.any(String));
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(response.headers["x-request-id"]).toBe(response.body.requestId);
  });

  test("provides the same health probes under the API prefix", async () => {
    const response = await request(createTestApp())
      .get("/api/v1/health/database")
      .expect(200);

    expect(response.body.data).toEqual({ status: "up", latencyMs: 1 });
  });

  test("returns 503 when readiness dependencies are unavailable", async () => {
    const healthService = {
      getLiveness: () => ({
        statusCode: 200,
        message: "Alive",
        data: { status: "ok" },
      }),
      getReadiness: async () => ({
        statusCode: 503,
        message: "Service is not ready",
        data: { status: "not_ready", checks: { database: { status: "down" } } },
      }),
      getDatabaseHealth: async () => ({
        statusCode: 503,
        message: "Database is unreachable",
        data: { status: "down" },
      }),
    };

    const response = await request(createTestApp({ healthService }))
      .get("/health/ready")
      .expect(503);

    expect(response.body).toMatchObject({
      success: true,
      data: { status: "not_ready", checks: { database: { status: "down" } } },
    });
  });

  test("describes the API at the version root", async () => {
    const response = await request(createTestApp()).get("/api/v1").expect(200);

    expect(response.body.data).toMatchObject({
      service: "smart-tourist-safety-backend-test",
      apiVersion: "v1",
    });
  });

  test("uses a client request ID only when it is safe", async () => {
    const app = createTestApp();
    const accepted = await request(app)
      .get("/health")
      .set("X-Request-ID", "team-demo:request-42")
      .expect(200);
    const replaced = await request(app)
      .get("/health")
      .set("X-Request-ID", "unsafe request id")
      .expect(200);

    expect(accepted.headers["x-request-id"]).toBe("team-demo:request-42");
    expect(replaced.headers["x-request-id"]).not.toBe("unsafe request id");
    expect(replaced.headers["x-request-id"]).toMatch(/^[a-f0-9-]{36}$/);
  });

  test("adds security headers", async () => {
    const response = await request(createTestApp()).get("/health").expect(200);

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["content-security-policy"]).toContain(
      "default-src 'none'",
    );
  });

  test("rejects unknown browser origins", async () => {
    const response = await request(createTestApp())
      .get("/api/v1")
      .set("Origin", "https://untrusted.example")
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: "CORS_ORIGIN_DENIED" },
    });
  });

  test("normalizes malformed JSON errors", async () => {
    const response = await request(createTestApp())
      .post("/api/v1/not-yet-implemented")
      .set("Content-Type", "application/json")
      .send('{"broken":')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MALFORMED_JSON", message: "Malformed JSON request body" },
    });
  });

  test("returns a consistent 404 without leaking a stack", async () => {
    const response = await request(createTestApp())
      .get("/missing-route")
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: "ROUTE_NOT_FOUND" },
    });
    expect(response.body.error.details?.stack).toBeUndefined();
  });

  test("rejects oversized JSON through the central error envelope", async () => {
    const response = await request(createTestApp())
      .post("/api/v1/not-yet-implemented")
      .set("Content-Type", "application/json")
      .send({ value: "x".repeat(1024 * 1024 + 1) })
      .expect(413);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: "PAYLOAD_TOO_LARGE" },
    });
  });

  test("rate limits API traffic while leaving infrastructure probes available", async () => {
    const rateLimiter = createApiRateLimiter({
      ...environment,
      RATE_LIMIT_MAX: 1,
      RATE_LIMIT_WINDOW_MS: 60_000,
    });
    const app = createTestApp({ rateLimiter });

    await request(app).get("/api/v1").expect(200);
    const limited = await request(app).get("/api/v1").expect(429);
    await request(app).get("/health").expect(200);

    expect(limited.body).toMatchObject({
      success: false,
      error: { code: "RATE_LIMIT_EXCEEDED" },
    });
  });
});
