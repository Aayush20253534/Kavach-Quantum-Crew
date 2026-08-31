import { prisma } from "../../config/database.js";

const incidentSeverityForHazard = (severity) => {
  if (severity === "CRITICAL") return "CRITICAL";
  if (severity === "HIGH") return "DANGER";
  return "WARNING";
};

export const createHazardRepository = ({ db = prisma } = {}) => ({
  findActiveTripForTourist(userId) {
    return db.trip.findFirst({
      where: {
        status: "ACTIVE",
        OR: [
          { touristId: userId },
          { group: { is: { members: { some: { userId, leftAt: null } } } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
  },

  async createWithIncident({ tripId, ...data }) {
    return db.$transaction(async (tx) => {
      const hazard = await tx.hazardReport.create({ data });

      // Manual tourist reports are valid only during an ACTIVE trip. The service
      // resolves that trip before this transaction, therefore every accepted
      // report must also become a first-class Incident in the shared queue.
      const incident = await tx.incident.create({
        data: {
          tripId,
          userId: data.reporterId,
          // Hazard reports are safety-origin incidents. Keeping the existing enum
          // avoids a schema migration while the event metadata preserves provenance.
          sourceType: "SAFETY_ALERT",
          severity: incidentSeverityForHazard(data.severity),
          title: data.title,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });

      await tx.incidentEvent.create({
        data: {
          incidentId: incident.id,
          type: "CREATED",
          actorId: data.reporterId,
          actorRole: data.reporterRole,
          metadata: {
            hazardReportId: hazard.id,
            hazardType: hazard.type,
            hazardSeverity: hazard.severity,
            locationName: hazard.locationName,
          },
        },
      });

      return { hazard, incident };
    });
  },

  create(data) {
    return db.hazardReport.create({ data });
  },

  findById(id) {
    return db.hazardReport.findUnique({ where: { id } });
  },

  list({ actorId, mine, status, type, severity, limit }) {
    return db.hazardReport.findMany({
      where: {
        ...(mine ? { reporterId: actorId } : {}),
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(severity ? { severity } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
    });
  },

  nearby({ minLat, maxLat, minLon, maxLon, type, severity, limit }) {
    return db.hazardReport.findMany({
      where: {
        status: "VERIFIED",
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLon, lte: maxLon },
        ...(type ? { type } : {}),
        ...(severity ? { severity } : {}),
      },
      orderBy: [{ severity: "desc" }, { verifiedAt: "desc" }],
      take: Math.min(limit * 4, 400),
    });
  },

  moderate(id, data) {
    return db.hazardReport.update({ where: { id }, data });
  },

  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({
      data: { actorId, actorRole, action, entityType: "HazardReport", entityId, metadata },
    });
  },
});

export const hazardRepository = createHazardRepository();
export default hazardRepository;
