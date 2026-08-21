import { createEnvironment } from "../../src/config/environment.js";

const requiredEnvironment = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/safety",
};

describe("environment configuration", () => {
  test("applies safe development defaults", () => {
    const config = createEnvironment(requiredEnvironment);

    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(4000);
    expect(config.API_PREFIX).toBe("/api/v1");
    expect(config.CORS_ORIGINS).toEqual(["http://localhost:5173"]);
    expect(config.IS_DEVELOPMENT).toBe(true);
    expect(Object.isFrozen(config)).toBe(true);
  });

  test("parses booleans, integers, and comma-separated origins", () => {
    const config = createEnvironment({
      ...requiredEnvironment,
      PORT: "8080",
      TRUST_PROXY: "yes",
      SOCKET_IO_ENABLED: "0",
      CORS_ORIGINS:
        "https://one.example, https://two.example,https://one.example",
    });

    expect(config.PORT).toBe(8080);
    expect(config.TRUST_PROXY).toBe(true);
    expect(config.SOCKET_IO_ENABLED).toBe(false);
    expect(config.CORS_ORIGINS).toEqual([
      "https://one.example",
      "https://two.example",
    ]);
  });

  test("rejects a missing database URL", () => {
    expect(() => createEnvironment({})).toThrow(/DATABASE_URL/);
  });

  test("rejects wildcard CORS when credentials are enabled", () => {
    expect(() =>
      createEnvironment({
        ...requiredEnvironment,
        CORS_ORIGINS: "*",
        CORS_CREDENTIALS: "true",
      }),
    ).toThrow(/cannot contain \*/);
  });

  test("rejects malformed numeric values with a useful startup error", () => {
    expect(() =>
      createEnvironment({ ...requiredEnvironment, PORT: "not-a-port" }),
    ).toThrow(/Invalid environment configuration/);
  });
});
