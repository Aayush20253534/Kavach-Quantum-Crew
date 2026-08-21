import { rateLimit } from "express-rate-limit";

import { ApiResponse } from "../common/responses/ApiResponse.js";
import { environment } from "../config/environment.js";

export const createApiRateLimiter = (config = environment) =>
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    limit: config.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    passOnStoreError: true,
    handler: (_request, response) =>
      ApiResponse.failure(response, {
        statusCode: 429,
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
      }),
  });

export const apiRateLimiter = createApiRateLimiter();

export default apiRateLimiter;
