import { rateLimit } from "express-rate-limit";

import { ApiResponse } from "../common/responses/ApiResponse.js";
import { environment } from "../config/environment.js";

const rateLimitHandler = (_request, response) =>
  ApiResponse.failure(response, {
    statusCode: 429,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later.",
  });

export const createApiRateLimiter = (config = environment) =>
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    limit: config.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    passOnStoreError: true,
    handler: rateLimitHandler,
  });

const SENSITIVE_PREFIXES = [
  "/auth",
  "/sos",
  "/evidence",
  "/admin",
  "/integrations",
  "/notification-deliveries",
];

const isSensitiveMutation = (request) => {
  if (!new Set(["POST", "PUT", "PATCH", "DELETE"]).has(request.method)) {
    return false;
  }

  return SENSITIVE_PREFIXES.some((prefix) => request.path.startsWith(prefix));
};

export const createSensitiveActionRateLimiter = (config = environment) =>
  rateLimit({
    windowMs: config.SENSITIVE_RATE_LIMIT_WINDOW_MS,
    limit: config.SENSITIVE_RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    passOnStoreError: true,
    skip: (request) => !isSensitiveMutation(request),
    handler: rateLimitHandler,
  });

export const apiRateLimiter = createApiRateLimiter();
export const sensitiveActionRateLimiter = createSensitiveActionRateLimiter();

export default apiRateLimiter;
