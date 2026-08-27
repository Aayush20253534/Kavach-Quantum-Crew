import { prisma } from "../../config/database.js";

const incidentSeverityForHazard = (severity) => {
  if (severity === "CRITICAL") return "CRITICAL";
  if (severity === "HIGH") return "DANGER";
  return "WARNING";
};

export const createHazardRepository = ({ db = prisma } = {}) => ({
  async createWithIncident(data) {
    return db.$transaction(async (tx) => {
      const hazard = await tx.hazardReport.create({ data });

      // A safety concern belongs in the same operational incident queue as SOS
      // and automated safety alerts. Prefer the active trip, but fall back to the
      // reporter's most recent trip so a report submitted just after a trip state
      // transition is not silently stranded as a HazardReport only.
      const ownershipFilter = [
        { touristId: data.reporterId },
        {
          group: {
            is: {
              members: { some: { userId: data.reporterId } },
            },
          },
        },
      ];
      const trip = await tx.trip.findFirst({
        where: { status: "ACTIVE", OR: ownershipFilter },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (!trip) return { hazard, incident: null };

      const incident = await tx.incident.create({
        data: {
          tripId: trip.id,
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
