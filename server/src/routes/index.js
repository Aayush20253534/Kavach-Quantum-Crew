import { Router } from "express";

import { ApiResponse } from "../common/responses/ApiResponse.js";
import { environment } from "../config/environment.js";

import { createAlertRouter } from "../modules/alert/alert.routes.js";
import { createDisasterManagementRouter } from "../modules/disaster-management/disaster-management.routes.js";
import { createDispatchRouter } from "../modules/dispatch/dispatch.routes.js";
import { createIncidentRouter } from "../modules/incident/incident.routes.js";
import { createNotificationRouter } from "../modules/notification/notification.routes.js";
import { createEscalationRouter } from "../modules/escalation/escalation.routes.js";
import { createSosRouter } from "../modules/sos/sos.routes.js";
import { createAuthRouter } from "../modules/auth/auth.routes.js";
import { createGroupRouter } from "../modules/group/group.routes.js";
import { createHealthRouter } from "../modules/health/health.routes.js";
import { createHazardRouter } from "../modules/hazard/hazard.routes.js";
import { createMonitoringRouter } from "../modules/monitoring/monitoring.routes.js";
import { createRiskZoneRouter } from "../modules/risk-zone/risk-zone.routes.js";
import { createSafetyRouter } from "../modules/safety/safety.routes.js";
import { createTouristRouter } from "../modules/tourist/tourist.routes.js";
import { createTrackingRouter } from "../modules/tracking/tracking.routes.js";
import { createTripRouter } from "../modules/trip/trip.routes.js";

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

        phase6: {
          tracking: `${config.API_PREFIX}/tracking`,
        },

        phase7: { safety: `${config.API_PREFIX}/safety` },
        phase8: { alerts: `${config.API_PREFIX}/alerts`, sos: `${config.API_PREFIX}/sos`, incidents: `${config.API_PREFIX}/incidents`, disasterManagement: `${config.API_PREFIX}/disaster-management` },
        phase9: { notifications: `${config.API_PREFIX}/notifications`, escalations: `${config.API_PREFIX}/escalations` },
        phase10: { realtime: "Socket.IO authenticated realtime events" },
        phase11: { disasterManagement: `${config.API_PREFIX}/disaster-management` },
        phase12: { hazards: `${config.API_PREFIX}/hazards` },
        phase13: { riskZones: `${config.API_PREFIX}/risk-zones` },
        phase14: { monitoring: `${config.API_PREFIX}/monitoring` },
        phase15: { dispatch: `${config.API_PREFIX}/dispatch` },
      },
    }),
  );

  router.use(
    "/health",
    createHealthRouter(),
  );

  router.use(
    "/auth",
    createAuthRouter(),
  );

  router.use(
    "/tourists",
    createTouristRouter(),
  );

  router.use(
    "/trips",
    createTripRouter(),
  );

  router.use(
    "/groups",
    createGroupRouter(),
  );

  router.use(
    "/tracking",
    createTrackingRouter(),
  );

  router.use("/safety", createSafetyRouter());
  router.use("/alerts", createAlertRouter());
  router.use("/sos", createSosRouter());
  router.use("/incidents", createIncidentRouter());
  router.use("/disaster-management", createDisasterManagementRouter());
  router.use("/notifications", createNotificationRouter());
  router.use("/escalations", createEscalationRouter());
  router.use("/hazards", createHazardRouter());
  router.use("/risk-zones", createRiskZoneRouter());
  router.use("/monitoring", createMonitoringRouter());
  router.use("/dispatch", createDispatchRouter());

  return router;
};

export const apiRouter = createApiRouter();

export default apiRouter;