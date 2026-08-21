import { ApiError } from "../common/errors/ApiError.js";
import { environment } from "./environment.js";

const isOriginAllowed = (origin, allowedOrigins) =>
  !origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin);

export const buildCorsOptions = (config = environment) => ({
  origin(origin, callback) {
    if (isOriginAllowed(origin, config.CORS_ORIGINS)) {
      callback(null, true);
      return;
    }

    callback(
      new ApiError(403, "This origin is not allowed to access the API", {
        code: "CORS_ORIGIN_DENIED",
        details: { origin },
      }),
    );
  },
  credentials: config.CORS_CREDENTIALS,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Accept", "Authorization", "Content-Type", "X-Request-ID"],
  exposedHeaders: [
    "X-Request-ID",
    "RateLimit",
    "RateLimit-Policy",
    "Retry-After",
  ],
  maxAge: 600,
  optionsSuccessStatus: 204,
});

export const buildSocketCorsOptions = (config = environment) => ({
  origin: config.CORS_ORIGINS.includes("*") ? "*" : config.CORS_ORIGINS,
  credentials: config.CORS_CREDENTIALS,
  methods: ["GET", "POST"],
});

export const corsOptions = buildCorsOptions();
export const socketCorsOptions = buildSocketCorsOptions();

export default corsOptions;
