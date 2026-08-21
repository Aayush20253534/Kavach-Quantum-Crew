import { z } from "zod";

import { ApiError } from "../../src/common/errors/ApiError.js";
import { normalizeError } from "../../src/middleware/errorHandler.middleware.js";

describe("central error normalization", () => {
  test("keeps explicit API errors unchanged", () => {
    const error = ApiError.forbidden("No access", { code: "TEST_FORBIDDEN" });

    expect(normalizeError(error)).toBe(error);
    expect(error).toMatchObject({ statusCode: 403, code: "TEST_FORBIDDEN" });
  });

  test("turns Zod issues into safe field errors", () => {
    const validation = z
      .object({ name: z.string().min(2) })
      .safeParse({ name: "" });
    const error = normalizeError(validation.error);

    expect(error).toMatchObject({
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details: [{ field: "name" }],
    });
  });

  test("recognizes malformed JSON and oversized bodies", () => {
    const syntaxError = new SyntaxError("Unexpected end");
    syntaxError.status = 400;
    syntaxError.body = {};

    expect(normalizeError(syntaxError)).toMatchObject({
      statusCode: 400,
      code: "MALFORMED_JSON",
    });
    expect(normalizeError({ type: "entity.too.large" })).toMatchObject({
      statusCode: 413,
      code: "PAYLOAD_TOO_LARGE",
    });
  });

  test.each([
    ["P2002", 409, "UNIQUE_CONSTRAINT_VIOLATION"],
    ["P2025", 404, "RECORD_NOT_FOUND"],
  ])("maps Prisma %s safely", (prismaCode, statusCode, errorCode) => {
    const error = normalizeError({
      name: "PrismaClientKnownRequestError",
      code: prismaCode,
      meta: { target: ["email"] },
    });

    expect(error).toMatchObject({ statusCode, code: errorCode });
  });

  test("hides unexpected implementation errors behind a 500", () => {
    const original = new Error("database password should not be returned");
    const error = normalizeError(original);

    expect(error).toMatchObject({
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      isOperational: false,
    });
    expect(error.cause).toBe(original);
  });

  test("provides conventional helpers for common API outcomes", () => {
    expect(ApiError.badRequest()).toMatchObject({
      statusCode: 400,
      code: "BAD_REQUEST",
    });
    expect(ApiError.unauthorized()).toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
    expect(ApiError.notFound()).toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
    expect(ApiError.conflict()).toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
    expect(ApiError.tooManyRequests()).toMatchObject({
      statusCode: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
    expect(ApiError.serviceUnavailable()).toMatchObject({
      statusCode: 503,
      code: "SERVICE_UNAVAILABLE",
    });
  });
});
