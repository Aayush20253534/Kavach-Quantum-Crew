import { Router } from "express";

import { ApiResponse } from "../common/responses/ApiResponse.js";
import { environment } from "../config/environment.js";
import { createAuthRouter } from "../modules/auth/auth.routes.js";
import { createTouristRouter } from "../modules/tourist/tourist.routes.js";
import { createTripRouter } from "../modules/trip/trip.routes.js";
import { createGroupRouter } from "../modules/group/group.routes.js";

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
        phase1: {
          auth: `${config.API_PREFIX}/auth`,
          tourist: `${config.API_PREFIX}/tourists`,
        },
        phase4: {
          trips: `${config.API_PREFIX}/trips`,
        },
        phase5: {
          groups: `${config.API_PREFIX}/groups`,
        },
      },
    }),
  );

  router.use("/auth", createAuthRouter());
  router.use("/tourists", createTouristRouter());
  router.use("/trips", createTripRouter());
  router.use("/groups", createGroupRouter());

  return router;
};

export const apiRouter = createApiRouter();

export default apiRouter;
