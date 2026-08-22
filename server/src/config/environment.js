import "dotenv/config";
import { z } from "zod";

const booleanFromEnvironment = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return value;
}, z.boolean());

const integerFromEnvironment = (minimum, maximum) =>
  z.coerce.number().int().min(minimum).max(maximum);

const optionalString = (schema) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional(),
  );

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_NAME: z.string().trim().min(1).default("smart-tourist-safety-backend"),
    APP_VERSION: z.string().trim().min(1).default("0.1.0"),
    HOST: z.string().trim().min(1).default("0.0.0.0"),
    PORT: integerFromEnvironment(1, 65535).default(4000),
    API_PREFIX: z
      .string()
      .trim()
      .regex(
        /^\/[a-zA-Z0-9/_-]*[a-zA-Z0-9_-]$/,
        "must be a path such as /api/v1",
      )
      .default("/api/v1"),
    DATABASE_URL: z
      .string()
      .trim()
      .regex(/^postgres(?:ql)?:\/\//i, "must be a PostgreSQL connection URL"),
    DATABASE_POOL_MAX: integerFromEnvironment(1, 100).default(10),
    DATABASE_CONNECTION_TIMEOUT_MS: integerFromEnvironment(100, 120000).default(
      5000,
    ),
    CORS_ORIGINS: z.string().trim().min(1).default("http://localhost:5173"),
    CORS_CREDENTIALS: booleanFromEnvironment.default(true),
    SOCKET_IO_ENABLED: booleanFromEnvironment.default(true),
    JSON_BODY_LIMIT: z
      .string()
      .trim()
      .regex(/^\d+(?:\.\d+)?(?:b|kb|mb)$/i, "must look like 512kb or 1mb")
      .default("1mb"),
    RATE_LIMIT_WINDOW_MS: integerFromEnvironment(1000, 86400000).default(
      900000,
    ),
    RATE_LIMIT_MAX: integerFromEnvironment(1, 100000).default(100),
    SENSITIVE_RATE_LIMIT_WINDOW_MS: integerFromEnvironment(1000, 86400000).default(60000),
    SENSITIVE_RATE_LIMIT_MAX: integerFromEnvironment(1, 10000).default(20),
    SECURITY_MAX_OBJECT_DEPTH: integerFromEnvironment(2, 100).default(20),
    SECURITY_MAX_OBJECT_KEYS: integerFromEnvironment(10, 100000).default(2000),
    TRUST_PROXY: booleanFromEnvironment.default(false),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    SHUTDOWN_TIMEOUT_MS: integerFromEnvironment(1000, 120000).default(10000),
    ACCESS_TOKEN_SECRET: z.string().min(16).default("dev-access-token-secret-change-me"),
    REFRESH_TOKEN_SECRET: z.string().min(16).default("dev-refresh-token-secret-change-me"),
    ACCESS_TOKEN_TTL: z.string().trim().min(2).default("15m"),
    REFRESH_TOKEN_TTL_DAYS: integerFromEnvironment(1, 365).default(15),
    JWT_ISSUER: z.string().trim().min(1).default("smart-tourist-safety"),
    JWT_AUDIENCE: z.string().trim().min(1).default("smart-tourist-safety-client"),
    REFRESH_COOKIE_NAME: z.string().trim().min(1).default("sts_refresh"),
    INCIDENT_ACK_TIMEOUT_MINUTES: integerFromEnvironment(1, 1440).default(5),
    INCIDENT_ESCALATION_INTERVAL_MINUTES: integerFromEnvironment(1, 1440).default(5),
    EVIDENCE_MAX_FILE_BYTES: integerFromEnvironment(1024, 52428800).default(10485760),
    EVIDENCE_STORAGE_DIR: z.string().trim().min(1).default("storage/evidence"),
    GMAIL_USER: optionalString(z.string().trim().email()),
    GMAIL_APP_PASSWORD: optionalString(
      z.string().trim().transform((value) => value.replace(/\s+/g, "")).refine(
        (value) => value.length >= 16,
        "must contain at least 16 characters",
      ),
    ),
    EMAIL_FROM: optionalString(z.string().trim().email()),
    EMAIL_OTP_SECRET: z.string().min(16).default("dev-email-otp-secret-change-me"),
    EMAIL_OTP_TTL_MINUTES: integerFromEnvironment(1, 60).default(10),
    EMAIL_OTP_RESEND_COOLDOWN_SECONDS: integerFromEnvironment(10, 3600).default(60),
    EMAIL_OTP_MAX_ATTEMPTS: integerFromEnvironment(1, 20).default(5),
  })
  .superRefine((value, context) => {
    const origins = value.CORS_ORIGINS.split(",").map((origin) =>
      origin.trim(),
    );

    if (value.CORS_CREDENTIALS && origins.includes("*")) {
      context.addIssue({
        code: "custom",
        path: ["CORS_ORIGINS"],
        message: "cannot contain * when CORS_CREDENTIALS is true",
      });
    }

    if (value.NODE_ENV === "production" && origins.includes("*")) {
      context.addIssue({
        code: "custom",
        path: ["CORS_ORIGINS"],
        message: "cannot contain * in production",
      });
    }

    if (value.NODE_ENV === "production") {
      for (const key of ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET", "EMAIL_OTP_SECRET"]) {
        if (value[key].length < 32 || value[key].includes("change-me")) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: "must be at least 32 characters and use a non-default production secret",
          });
        }
      }

      if (!value.GMAIL_USER) {
        context.addIssue({
          code: "custom",
          path: ["GMAIL_USER"],
          message: "is required in production for tourist email verification",
        });
      }
      if (!value.GMAIL_APP_PASSWORD) {
        context.addIssue({
          code: "custom",
          path: ["GMAIL_APP_PASSWORD"],
          message: "is required in production for tourist email verification",
        });
      }
    }
  });

const formatEnvironmentErrors = (issues) =>
  issues
    .map(
      (issue) =>
        `  - ${issue.path.join(".") || "environment"}: ${issue.message}`,
    )
    .join("\n");

export const createEnvironment = (source = process.env) => {
  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    const error = new Error(
      `Invalid environment configuration:\n${formatEnvironmentErrors(result.error.issues)}`,
    );
    error.name = "EnvironmentConfigurationError";
    error.code = "INVALID_ENVIRONMENT";
    error.issues = result.error.issues;
    throw error;
  }

  const corsOrigins = result.data.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Object.freeze({
    ...result.data,
    CORS_ORIGINS: Object.freeze([...new Set(corsOrigins)]),
    IS_DEVELOPMENT: result.data.NODE_ENV === "development",
    IS_TEST: result.data.NODE_ENV === "test",
    IS_PRODUCTION: result.data.NODE_ENV === "production",
  });
};

export const environment = createEnvironment();

export default environment;
