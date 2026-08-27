import { ZodError } from "zod";

import { ApiError } from "../common/errors/ApiError.js";
import { ApiResponse } from "../common/responses/ApiResponse.js";
import { environment } from "../config/environment.js";
import { logger } from "../config/logger.js";

const normalizeError = (error) => {
  if (error instanceof ApiError) return error;

  if (error instanceof ZodError) {
    return new ApiError(422, "Request validation failed", {
      code: "VALIDATION_ERROR",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      cause: error,
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return ApiError.badRequest("Malformed JSON request body", {
      code: "MALFORMED_JSON",
      cause: error,
    });
  }

  if (error?.type === "entity.too.large") {
    return new ApiError(413, "Request body is too large", {
      code: "PAYLOAD_TOO_LARGE",
      cause: error,
    });
  }

  if (error?.name === "PrismaClientKnownRequestError") {
    if (error.code === "P2002") {
      return ApiError.conflict("This information could not be saved. Please review the details and try again.", {
        code: "CONFLICT",
        cause: error,
      });
    }

    if (error.code === "P2025") {
      return ApiError.notFound("The requested record does not exist", {
        code: "RECORD_NOT_FOUND",
        cause: error,
      });
    }
  }

  return new ApiError(500, "Internal server error", {
    code: "INTERNAL_SERVER_ERROR",
    cause: error,
    isOperational: false,
  });
};

export const errorHandlerMiddleware = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const apiError = normalizeError(error);
  const requestLogger = request.log ?? logger;
  const logContext = {
    err: error,
    requestId: request.id,
    method: request.method,
    url: request.originalUrl,
    statusCode: apiError.statusCode,
    errorCode: apiError.code,
  };

  if (apiError.statusCode >= 500) {
    requestLogger.error(logContext, "Request failed");
  } else {
    requestLogger.warn(logContext, "Request rejected");
  }

  const details = environment.IS_PRODUCTION
    ? apiError.details
    : {
        ...(apiError.details === undefined
          ? {}
          : { context: apiError.details }),
        ...(environment.IS_DEVELOPMENT ? { stack: error.stack } : {}),
      };

  return ApiResponse.failure(response, {
    statusCode: apiError.statusCode,
    code: apiError.code,
    message:
      apiError.statusCode >= 500 && environment.IS_PRODUCTION
        ? "An unexpected error occurred"
        : apiError.message,
    details: details && Object.keys(details).length > 0 ? details : undefined,
  });
};

export { normalizeError };
export default errorHandlerMiddleware;
