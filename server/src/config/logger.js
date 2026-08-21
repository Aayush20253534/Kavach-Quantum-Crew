import pino from "pino";
import pinoHttp from "pino-http";

import { environment } from "./environment.js";

const redact = {
  paths: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers.set-cookie",
    "password",
    "token",
    "accessToken",
    "refreshToken",
  ],
  censor: "[REDACTED]",
};

export const logger = pino({
  name: environment.APP_NAME,
  level: environment.LOG_LEVEL,
  base: {
    service: environment.APP_NAME,
    version: environment.APP_VERSION,
    environment: environment.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact,
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (request) => request.id,
  customProps: (request) => ({ requestId: request.id }),
  customLogLevel: (_request, response, error) => {
    if (error || response.statusCode >= 500) return "error";
    if (response.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req: (request) => ({
      id: request.id,
      method: request.method,
      url: request.url,
      remoteAddress: request.remoteAddress,
      userAgent: request.headers?.["user-agent"],
    }),
    res: (response) => ({ statusCode: response.statusCode }),
    err: pino.stdSerializers.err,
  },
  redact,
});

export default logger;
