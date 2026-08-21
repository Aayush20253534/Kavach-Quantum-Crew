export class ApiError extends Error {
  constructor(
    statusCode,
    message,
    {
      code = "API_ERROR",
      details = undefined,
      cause = undefined,
      isOperational = true,
    } = {},
  ) {
    super(message, cause ? { cause } : undefined);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = "Bad request", options = {}) {
    return new ApiError(400, message, { code: "BAD_REQUEST", ...options });
  }

  static unauthorized(message = "Authentication required", options = {}) {
    return new ApiError(401, message, { code: "UNAUTHORIZED", ...options });
  }

  static forbidden(
    message = "You do not have permission to perform this action",
    options = {},
  ) {
    return new ApiError(403, message, { code: "FORBIDDEN", ...options });
  }

  static notFound(message = "Resource not found", options = {}) {
    return new ApiError(404, message, { code: "NOT_FOUND", ...options });
  }

  static conflict(message = "Resource conflict", options = {}) {
    return new ApiError(409, message, { code: "CONFLICT", ...options });
  }

  static tooManyRequests(message = "Too many requests", options = {}) {
    return new ApiError(429, message, {
      code: "RATE_LIMIT_EXCEEDED",
      ...options,
    });
  }

  static serviceUnavailable(message = "Service unavailable", options = {}) {
    return new ApiError(503, message, {
      code: "SERVICE_UNAVAILABLE",
      ...options,
    });
  }
}

export default ApiError;
