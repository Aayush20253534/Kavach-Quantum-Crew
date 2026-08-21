import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { ApiResponse } from "./common/responses/ApiResponse.js";

import { buildCorsOptions } from "./config/cors.js";
import { environment } from "./config/environment.js";
import { httpLogger } from "./config/logger.js";
import {
  bodyParserOptions,
  helmetOptions,
  urlEncodedParserOptions,
} from "./config/security.js";
import { errorHandlerMiddleware } from "./middleware/errorHandler.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import {
  apiRateLimiter,
  sensitiveActionRateLimiter,
} from "./middleware/rateLimiter.middleware.js";
import {
  apiPrivacyHeadersMiddleware,
  requestSecurityMiddleware,
} from "./middleware/requestSecurity.middleware.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";
import { observabilityMiddleware } from "./middleware/observability.middleware.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { createApiRouter } from "./routes/index.js";

export const createApp = ({
  config = environment,
  healthService,
  rateLimiter = apiRateLimiter,
  sensitiveRateLimiter = sensitiveActionRateLimiter,
  requestSecurity = requestSecurityMiddleware,
} = {}) => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY);

  app.use(requestIdMiddleware);
  app.use(observabilityMiddleware);
  app.use(httpLogger);
  app.use(helmet(helmetOptions));
  app.use(cors(buildCorsOptions(config)));
  app.use(
    express.json({ ...bodyParserOptions, limit: config.JSON_BODY_LIMIT }),
  );
  app.use(
    express.urlencoded({
      ...urlEncodedParserOptions,
      limit: config.JSON_BODY_LIMIT,
    }),
  );
  app.use(cookieParser());
  app.use(requestSecurity);

  const healthRouter = createHealthRouter(
    healthService === undefined ? {} : { service: healthService },
  );

  app.get("/", (_request, response) =>
    ApiResponse.success(response, {
      message: "Smart Tourist Safety backend is running",
      data: {
        service: config.APP_NAME,
        version: config.APP_VERSION,
        api: config.API_PREFIX,
        health: "/health",
        readiness: "/health/ready",
      },
    }),
  );

  // Root probes are convenient for orchestrators; prefixed probes keep the API consistent.
  app.use("/health", healthRouter);
  app.use(`${config.API_PREFIX}/health`, healthRouter);

  app.use(
    config.API_PREFIX,
    apiPrivacyHeadersMiddleware,
    rateLimiter,
    sensitiveRateLimiter,
    createApiRouter(config),
  );

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
};

const app = createApp();

export default app;
