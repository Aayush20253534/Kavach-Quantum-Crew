import { cacheGetOrSet } from "../../common/cache/cache.js";
import { prisma } from "../../config/database.js";
import { environment } from "../../config/environment.js";

export const createDashboardRepository = ({ db = prisma } = {}) => ({
  totalTourists() {
    return cacheGetOrSet({
      key: "dashboard:total-tourists",
      ttlSeconds: environment.REDIS_DASHBOARD_TTL_SECONDS,
      fetcher: () => db.user.count(),
    });
  },

  activeAlerts(userId) {
    return db.safetyAlert.count({
      where: {
        userId,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
    });
  },

  currentTrip(userId) {
    return db.trip.findFirst({
      where: {
        touristId: userId,
        status: { in: ["PLANNED", "ACTIVE"] },
      },
      include: {
        group: {
          include: {
            members: {
              where: { leftAt: null },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  activeRiskZones() {
    return cacheGetOrSet({
      key: "dashboard:active-risk-zones",
      ttlSeconds: environment.REDIS_RISK_ZONES_TTL_SECONDS,
      fetcher: () =>
        db.safetyZone.findMany({
          where: { active: true, type: "RISK" },
        }),
    });
  },
});

export const dashboardRepository = createDashboardRepository();
export default dashboardRepository;
