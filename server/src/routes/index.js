import { Router } from "express";

import { ApiResponse } from "../common/responses/ApiResponse.js";
import { environment } from "../config/environment.js";

export const createApiRouter = (config = environment) => {
  const router = Router();

  router.get("/", (_request, response) =>
    ApiResponse.success(response, {
      message: "Smart Tourist Safety API",
      data: {
        service: config.APP_NAME,
        version: config.APP_VERSION,
        apiVersion: config.API_PREFIX.split("/").at(-1),
        health: {
          live: `${config.API_PREFIX}/health`,
          ready: `${config.API_PREFIX}/health/ready`,
          database: `${config.API_PREFIX}/health/database`,
        },
      },
    }),
  );

  return router;
};

export const apiRouter = createApiRouter();

export default apiRouter;
