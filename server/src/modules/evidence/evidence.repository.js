import { prisma } from "../../config/database.js";

export const createEvidenceRepository = ({ db = prisma } = {}) => ({
  findIncident(id) {
    return db.incident.findUnique({
      where: { id },
      select: { id: true, tripId: true, userId: true, status: true },
    });
  },

  findTripContext(tripId, userId) {
    return db.trip.findUnique({
      where: { id: tripId },
      include: {
        group: {
          include: {
            members: { where: { userId, leftAt: null }, select: { userId: true } },
          },
        },
      },
    });
  },

  findHazard(id) {
    return db.hazardReport.findUnique({
      where: { id },
      select: { id: true, reporterId: true, reporterRole: true, status: true },
    });
  },

  create(data) {
    return db.attachment.create({ data });
  },

  findById(id) {
    return db.attachment.findUnique({ where: { id } });
  },

  list({ incidentId, hazardId, limit }) {
    return db.attachment.findMany({
      where: incidentId ? { incidentId } : { hazardId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
    });
  },

  delete(id) {
    return db.attachment.delete({ where: { id } });
  },

  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({
      data: { actorId, actorRole, action, entityType: "Attachment", entityId, metadata },
    });
  },
});

export const evidenceRepository = createEvidenceRepository();
export default evidenceRepository;
