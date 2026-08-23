import { redis, redisKey } from "../../config/redis.js";

export const cacheGetOrSet = async ({
  key,
  ttlSeconds,
  fetcher,
  client = redis,
  logger = console,
}) => {
  if (!client) return fetcher();

  const namespacedKey = redisKey(key);
  try {
    const cached = await client.get(namespacedKey);
    if (cached !== null && cached !== undefined) return cached;
  } catch (error) {
    logger.warn?.("Redis read failed; using PostgreSQL", {
      key: namespacedKey,
      error: error?.message,
    });
  }

  const value = await fetcher();

  try {
    await client.set(namespacedKey, value, { ex: ttlSeconds });
  } catch (error) {
    logger.warn?.("Redis write failed; returning PostgreSQL value", {
      key: namespacedKey,
      error: error?.message,
    });
  }
  return value;
};

export const cacheDelete = async ({ keys, client = redis, logger = console }) => {
  if (!client) return;
  const list = (Array.isArray(keys) ? keys : [keys]).filter(Boolean).map(redisKey);
  if (!list.length) return;
  try {
    await client.del(...list);
  } catch (error) {
    logger.warn?.("Redis invalidation failed", { keys: list, error: error?.message });
  }
};
