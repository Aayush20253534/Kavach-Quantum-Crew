import { Router } from "express";

import { ApiResponse } from "../common/responses/ApiResponse.js";
import { environment } from "../config/environment.js";

import { createAlertRouter } from "../modules/alert/alert.routes.js";
import { createAnalyticsRouter } from "../modules/analytics/analytics.routes.js";
import { createDisasterManagementRouter } from "../modules/disaster-management/disaster-management.routes.js";
import { createDispatchRouter } from "../modules/dispatch/dispatch.routes.js";
import { createDashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { createDestinationRouter } from "../modules/destination/destination.routes.js";
import { createIncidentRouter } from "../modules/incident/incident.routes.js";
import { createIntegrationRouter } from "../modules/integrations/integration.routes.js";
import { createNotificationRouter } from "../modules/notification/notification.routes.js";
import { createNotificationDeliveryRouter } from "../modules/notification-delivery/notification-delivery.routes.js";
import { createAuditRouter } from "../modules/audit/audit.routes.js";
import { createObservabilityRouter } from "../modules/observability/observability.routes.js";
import { createEscalationRouter } from "../modules/escalation/escalation.routes.js";
import { createEvidenceRouter } from "../modules/evidence/evidence.routes.js";
import { createSosRouter } from "../modules/sos/sos.routes.js";
import { createSystemAdminRouter } from "../modules/system-admin/system-admin.routes.js";
import { createAuthRouter } from "../modules/auth/auth.routes.js";
import { createChatbotRouter } from "../modules/chatbot/chatbot.routes.js";
import { createCredentialRouter } from "../modules/credential/credential.routes.js";
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
        phase16: { incidentCommunication: `${config.API_PREFIX}/incidents/:incidentId/messages` },
        phase17: { evidence: `${config.API_PREFIX}/evidence` },
        phase18: { systemAdmin: `${config.API_PREFIX}/admin` },
        phase19: { analytics: `${config.API_PREFIX}/analytics` },
        phase20_21: { integrations: `${config.API_PREFIX}/integrations` },
        phase26: { chatbot: `${config.API_PREFIX}/chatbot` },
        dashboard: { tourist: `${config.API_PREFIX}/dashboard/tourist`, destinations: `${config.API_PREFIX}/destinations` },
        phase22: { notificationDeliveries: `${config.API_PREFIX}/notification-deliveries` },
        phase24: { audit: `${config.API_PREFIX}/audit`, observability: `${config.API_PREFIX}/observability` },
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

  router.use("/credentials", createCredentialRouter());

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
  router.use("/notification-deliveries", createNotificationDeliveryRouter());
  router.use("/escalations", createEscalationRouter());
  router.use("/hazards", createHazardRouter());
  router.use("/risk-zones", createRiskZoneRouter());
  router.use("/monitoring", createMonitoringRouter());
  router.use("/dispatch", createDispatchRouter());
  router.use("/evidence", createEvidenceRouter());
  router.use("/admin", createSystemAdminRouter());
  router.use("/analytics", createAnalyticsRouter());
  router.use("/chatbot", createChatbotRouter());
  router.use("/dashboard", createDashboardRouter());
  router.use("/destinations", createDestinationRouter());
  router.use("/integrations", createIntegrationRouter());
  router.use("/audit", createAuditRouter());
  router.use("/observability", createObservabilityRouter());

  return router;
};

export const apiRouter = createApiRouter();

export default apiRouter;