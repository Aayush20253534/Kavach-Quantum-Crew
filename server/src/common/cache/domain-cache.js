import { cacheDelete, cacheDeletePrefix } from "./cache.js";

export const invalidateSafetyZoneCaches = async ({ logger = console } = {}) => {
  await Promise.all([
    cacheDeletePrefix({ prefix: "safety-zones:", logger }),
    cacheDeletePrefix({ prefix: "risk-zones:", logger }),
    cacheDelete({ keys: "dashboard:active-risk-zones", logger }),
  ]);
};
