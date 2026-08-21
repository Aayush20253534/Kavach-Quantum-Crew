import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

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
import { apiRateLimiter } from "./middleware/rateLimiter.middleware.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { createApiRouter } from "./routes/index.js";

export const createApp = ({
  config = environment,
  healthService,
  rateLimiter = apiRateLimiter,
} = {}) => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY);

  app.use(requestIdMiddleware);
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

  const healthRouter = createHealthRouter(
    healthService === undefined ? {} : { service: healthService },
  );

  // Root probes are convenient for orchestrators; prefixed probes keep the API consistent.
  app.use("/health", healthRouter);
  app.use(`${config.API_PREFIX}/health`, healthRouter);

  app.use(config.API_PREFIX, rateLimiter, createApiRouter(config));

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
};

const app = createApp();

export default app;
