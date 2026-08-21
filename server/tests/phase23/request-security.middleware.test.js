import { createRequestSecurityMiddleware } from "../../src/middleware/requestSecurity.middleware.js";

const run = (middleware, request) =>
  new Promise((resolve) => {
    middleware(request, {}, (error) => {
      resolve(error);
    });
  });

describe("Phase 23 request security middleware", () => {
  const middleware = createRequestSecurityMiddleware({
    SECURITY_MAX_OBJECT_DEPTH: 3,
    SECURITY_MAX_OBJECT_KEYS: 5,
  });

  test("accepts a normal bounded request", async () => {
    const error = await run(middleware, {
      params: {},
      query: { page: "1" },
      body: {
        profile: {
          name: "Tourist",
        },
      },
    });

    expect(error).toBeUndefined();
  });

  test("rejects prototype-pollution keys", async () => {
    const body = JSON.parse(
      '{"profile":{"__proto__":{"admin":true}}}',
    );

    const error = await run(middleware, {
      params: {},
      query: {},
      body,
    });

    expect(error).toMatchObject({
      statusCode: 400,
      code: "REQUEST_KEY_FORBIDDEN",
    });
  });

  test("rejects excessive nesting", async () => {
    const error = await run(middleware, {
      params: {},
      query: {},
      body: {
        a: {
          b: {
            c: {
              d: true,
            },
          },
        },
      },
    });

    expect(error).toMatchObject({
      statusCode: 400,
      code: "REQUEST_STRUCTURE_TOO_DEEP",
    });
  });

  test("rejects excessive field counts", async () => {
    const error = await run(middleware, {
      params: {},
      query: {},
      body: {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
        f: 6,
      },
    });

    expect(error).toMatchObject({
      statusCode: 400,
      code: "REQUEST_STRUCTURE_TOO_LARGE",
    });
  });
});