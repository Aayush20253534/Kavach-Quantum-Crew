import { createHash } from "node:crypto";

import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";
import { objectStorageAdapter } from "../../integrations/storage/objectStorage.adapter.js";
import { evidenceRepository } from "./evidence.repository.js";

const STAFF = new Set([ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN]);
const CLOSED_INCIDENTS = new Set(["RESOLVED", "DISMISSED"]);
const CLOSED_HAZARDS = new Set(["REJECTED", "RESOLVED"]);

const isParticipant = (trip, userId) =>
  trip?.touristId === userId || Boolean(trip?.group?.members?.some((member) => member.userId === userId));

const kindForMime = (mimeType) => {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
};

export const createEvidenceService = ({
  repository = evidenceRepository,
  storage = objectStorageAdapter,
  publisher = realtimePublisher,
} = {}) => {
  const incidentAccess = async (actor, incidentId, write = false) => {
    const incident = await repository.findIncident(incidentId);
    if (!incident) throw ApiError.notFound("Incident not found", { code: "INCIDENT_NOT_FOUND" });

    let allowed = STAFF.has(actor.role) || incident.userId === actor.id;
    if (!allowed && actor.role === ROLES.TOURIST) {
      const trip = await repository.findTripContext(incident.tripId, actor.id);
      allowed = Boolean(trip && isParticipant(trip, actor.id));
    }
    if (!allowed) throw ApiError.notFound("Incident not found", { code: "INCIDENT_NOT_FOUND" });
    if (write && CLOSED_INCIDENTS.has(incident.status)) {
      throw ApiError.conflict("Closed incidents cannot receive evidence", { code: "INCIDENT_EVIDENCE_CLOSED" });
    }
    return incident;
  };

  const hazardAccess = async (actor, hazardId, write = false) => {
    const hazard = await repository.findHazard(hazardId);
    if (!hazard) throw ApiError.notFound("Hazard report not found", { code: "HAZARD_NOT_FOUND" });
    const allowed = STAFF.has(actor.role) || (hazard.reporterId === actor.id && hazard.reporterRole === actor.role);
    if (!allowed) throw ApiError.notFound("Hazard report not found", { code: "HAZARD_NOT_FOUND" });
    if (write && CLOSED_HAZARDS.has(hazard.status)) {
      throw ApiError.conflict("Closed hazard reports cannot receive evidence", { code: "HAZARD_EVIDENCE_CLOSED" });
    }
    return hazard;
  };

  const targetAccess = async (actor, target, write = false) => {
    if (target.incidentId) {
      return { targetType: "INCIDENT", target: await incidentAccess(actor, target.incidentId, write) };
    }
    return { targetType: "HAZARD", target: await hazardAccess(actor, target.hazardId, write) };
  };

  const visibleAttachment = async (actor, attachment) => {
    if (!attachment) throw ApiError.notFound("Attachment not found", { code: "ATTACHMENT_NOT_FOUND" });
    await targetAccess(actor, { incidentId: attachment.incidentId, hazardId: attachment.hazardId });
    return attachment;
  };

  return Object.freeze({
    async upload(actor, target, file) {
      if (!file?.buffer?.length) {
        throw ApiError.badRequest("Evidence file is required", { code: "EVIDENCE_FILE_REQUIRED" });
      }
      const context = await targetAccess(actor, target, true);
      const checksumSha256 = createHash("sha256").update(file.buffer).digest("hex");
      const stored = await storage.put({
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
      });

      try {
        const attachment = await repository.create({
          targetType: context.targetType,
          incidentId: target.incidentId ?? null,
          hazardId: target.hazardId ?? null,
          uploaderId: actor.id,
          uploaderRole: actor.role,
          kind: kindForMime(file.mimetype),
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageKey: stored.storageKey,
          checksumSha256,
        });
        await repository.createAudit({
          actorId: actor.id,
          actorRole: actor.role,
          action: "EVIDENCE_UPLOADED",
          entityId: attachment.id,
          metadata: { targetType: context.targetType, incidentId: target.incidentId ?? null, hazardId: target.hazardId ?? null },
        });
        publisher.publishEvidenceCreated?.(attachment, context.target);
        return attachment;
      } catch (error) {
        await storage.delete(stored.storageKey).catch(() => undefined);
        throw error;
      }
    },

    async list(actor, query) {
      await targetAccess(actor, query);
      return repository.list(query);
    },

    async get(actor, attachmentId) {
      return visibleAttachment(actor, await repository.findById(attachmentId));
    },

    async content(actor, attachmentId) {
      const attachment = await visibleAttachment(actor, await repository.findById(attachmentId));
      const buffer = await storage.get(attachment.storageKey);
      return { attachment, buffer };
    },

    async remove(actor, attachmentId) {
      const attachment = await visibleAttachment(actor, await repository.findById(attachmentId));
      const canDelete = actor.role === ROLES.SYSTEM_ADMIN ||
        (attachment.uploaderId === actor.id && attachment.uploaderRole === actor.role);
      if (!canDelete) {
        throw ApiError.forbidden("Only the uploader or system admin can delete evidence", { code: "EVIDENCE_DELETE_FORBIDDEN" });
      }
      await storage.delete(attachment.storageKey);
      await repository.delete(attachment.id);
      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "EVIDENCE_DELETED",
        entityId: attachment.id,
        metadata: { incidentId: attachment.incidentId, hazardId: attachment.hazardId },
      });
      publisher.publishEvidenceDeleted?.(attachment);
      return attachment;
    },
  });
};

export const evidenceService = createEvidenceService();
export default evidenceService;
