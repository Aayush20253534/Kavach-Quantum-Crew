import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";

import {
  getGroupLocations,
  getLatestLocation,
  grantTrackingConsent,
  revokeTrackingConsent,
  submitLocationPing,
} from "./tracking.controller.js";

import {
  groupLocationParamsSchema,
  latestLocationQuerySchema,
  locationPingBodySchema,
  trackingTripParamsSchema,
} from "./tracking.validation.js";

export const createTrackingRouter = () => {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/consent/:tripId",
    validate({
      params: trackingTripParamsSchema,
    }),
    grantTrackingConsent,
  );

  router.delete(
    "/consent/:tripId",
    validate({
      params: trackingTripParamsSchema,
    }),
    revokeTrackingConsent,
  );

  router.post(
    "/pings",
    validate({
      body: locationPingBodySchema,
    }),
    submitLocationPing,
  );

  router.get(
    "/latest",
    validate({
      query: latestLocationQuerySchema,
    }),
    getLatestLocation,
  );

  router.get(
    "/groups/:groupId",
    validate({
      params: groupLocationParamsSchema,
    }),
    getGroupLocations,
  );

  return router;
};

export default createTrackingRouter;