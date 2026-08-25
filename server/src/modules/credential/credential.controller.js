import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { credentialService } from "./credential.service.js";

export const credentialController = Object.freeze({
  me: async (req, res) => ApiResponse.success(res, { message: "Individual trip credential", data: await credentialService.getMyIndividual(req.params.tripId, req.user.id) }),
  group: async (req, res) => ApiResponse.success(res, { message: "Group trip credential", data: await credentialService.getGroup(req.params.groupId, req.user.id) }),
  verify: async (req, res) => ApiResponse.success(res, { message: "Credential verification", data: await credentialService.verifyToken(req.params.token) }),
});
