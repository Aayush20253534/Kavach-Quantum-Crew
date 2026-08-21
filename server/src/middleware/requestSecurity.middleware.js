import { ApiError } from "../common/errors/ApiError.js";

import { environment } from "../config/environment.js";

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
]);

const inspectValue = (
  value,
  limits,
  depth = 0,
  state = { keys: 0 },
  seen = new WeakSet(),
) => {
  if (value === null || typeof value !== "object") {
    return;
  }

  if (seen.has(value)) {
    return;
  }

  seen.add(value);

  if (depth >= limits.maxDepth) {
    throw ApiError.badRequest(
      "Request structure is too deeply nested",
      {
        code: "REQUEST_STRUCTURE_TOO_DEEP",
      },
    );
  }

  for (const key of Object.keys(value)) {
    state.keys += 1;

    if (state.keys > limits.maxKeys) {
      throw ApiError.badRequest(
        "Request contains too many fields",
        {
          code: "REQUEST_STRUCTURE_TOO_LARGE",
        },
      );
    }

    if (FORBIDDEN_KEYS.has(key)) {
      throw ApiError.badRequest(
        "Request contains a forbidden object key",
        {
          code: "REQUEST_KEY_FORBIDDEN",
        },
      );
    }

    inspectValue(
      value[key],
      limits,
      depth + 1,
      state,
      seen,
    );
  }
};

export const createRequestSecurityMiddleware = (
  config = environment,
) =>
  function requestSecurity(
    request,
    _response,
    next,
  ) {
    try {
      const limits = {
        maxDepth: config.SECURITY_MAX_OBJECT_DEPTH,
        maxKeys: config.SECURITY_MAX_OBJECT_KEYS,
      };

      for (const source of [
        request.params,
        request.query,
        request.body,
      ]) {
        inspectValue(source, limits);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

export const requestSecurityMiddleware =
  createRequestSecurityMiddleware();

export const apiPrivacyHeadersMiddleware = (
  _request,
  response,
  next,
) => {
  response.setHeader(
    "Cache-Control",
    "no-store",
  );

  response.setHeader(
    "Pragma",
    "no-cache",
  );

  return next();
};

export default requestSecurityMiddleware;