import { prisma } from "../../config/database.js";

export const createCommunicationRepository = ({ db = prisma } = {}) => ({
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
            members: {
              where: { userId, leftAt: null },
              select: { userId: true },
            },
          },
        },
      },
    });
  },

  createMessage(incidentId, actor, body) {
    return db.incidentMessage.create({
      data: {
        incidentId,
        senderId: actor.id,
        senderRole: actor.role,
        body,
      },
    });
  },

  listMessages(incidentId, { before, limit }) {
    return db.incidentMessage.findMany({
      where: {
        incidentId,
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
    });
  },

  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({
      data: {
        actorId,
        actorRole,
        action,
        entityType: "IncidentMessage",
        entityId,
        metadata,
      },
    });
  },
});

export const communicationRepository = createCommunicationRepository();

export default communicationRepository;
