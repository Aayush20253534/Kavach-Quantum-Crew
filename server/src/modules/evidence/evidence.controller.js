import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { evidenceService } from "./evidence.service.js";

export const createEvidenceController = ({ service = evidenceService } = {}) => ({
  upload: async (request, response) => ApiResponse.success(response, {
    statusCode: 201,
    message: "Evidence uploaded",
    data: await service.upload(request.user, request.body, request.file),
  }),
  list: async (request, response) => ApiResponse.success(response, {
    message: "Evidence attachments",
    data: await service.list(request.user, request.query),
  }),
  get: async (request, response) => ApiResponse.success(response, {
    message: "Evidence attachment",
    data: await service.get(request.user, request.params.attachmentId),
  }),
  content: async (request, response) => {
    const { attachment, buffer } = await service.content(request.user, request.params.attachmentId);
    response.setHeader("Content-Type", attachment.mimeType);
    response.setHeader("Content-Length", String(buffer.length));
    response.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`);
    return response.status(200).send(buffer);
  },
  remove: async (request, response) => ApiResponse.success(response, {
    message: "Evidence deleted",
    data: await service.remove(request.user, request.params.attachmentId),
  }),
});

export const evidenceController = createEvidenceController();
export default evidenceController;
