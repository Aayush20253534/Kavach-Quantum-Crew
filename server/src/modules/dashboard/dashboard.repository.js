import { prisma } from "../../config/database.js";

export const createDashboardRepository = ({ db = prisma } = {}) => ({
  totalTourists() {
    return db.user.count();
  },
  activeAlerts(userId) {
    return db.safetyAlert.count({
      where: { userId, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    });
  },
  currentTrip(userId) {
    return db.trip.findFirst({
      where: { touristId: userId, status: { in: ["PLANNED", "ACTIVE"] } },
      include: {
        group: {
          include: {
            members: { where: { leftAt: null }, select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },
  activeRiskZones() {
    return db.safetyZone.findMany({ where: { active: true, type: "RISK" } });
  },
});

export const dashboardRepository = createDashboardRepository();
export default dashboardRepository;
