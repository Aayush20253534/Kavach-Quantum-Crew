import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { signalLossService } from "./signal-loss.service.js";

export const signalLossController = Object.freeze({
  list: async (req, res) => ApiResponse.success(res, { message: "Active signal-loss cases", data: await signalLossService.listForLeader(req.user.id, req.query.tripId) }),
  respond: async (req, res) => ApiResponse.success(res, { message: "Signal-loss response recorded", data: await signalLossService.respond(req.user.id, req.params.caseId, req.body.response) }),
});
