import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { trackingService } from "./tracking.service.js";

export const grantTrackingConsent = asyncHandler(
  async (req, res) => {
    const result = await trackingService.grantConsent(
      req.user.id,
      req.params.tripId,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const revokeTrackingConsent = asyncHandler(
  async (req, res) => {
    const result = await trackingService.revokeConsent(
      req.user.id,
      req.params.tripId,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const submitLocationPing = asyncHandler(
  async (req, res) => {
    const result = await trackingService.submitPing(
      req.user.id,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  },
);

export const getLatestLocation = asyncHandler(
  async (req, res) => {
    const result = await trackingService.getLatest(
      req.user.id,
      req.query.tripId,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const getGroupLocations = asyncHandler(
  async (req, res) => {
    const result = await trackingService.getGroupLocations(
      req.user.id,
      req.params.groupId,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);