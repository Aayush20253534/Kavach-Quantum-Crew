import { redis, redisKey } from "../../config/redis.js";

// Prevent a burst of identical cache misses from fanning out into duplicate
// PostgreSQL / external API work inside the same Node process. Redis remains
// the cross-instance cache; this map only coalesces concurrent local misses.
const inFlight = new Map();

export const cacheGetOrSet = async ({
  key,
  ttlSeconds,
  fetcher,
  client = redis,
  logger = console,
  shouldCache = (value) => value !== undefined && value !== null,
}) => {
  if (!client) return fetcher();

  const namespacedKey = redisKey(key);
  try {
    const cached = await client.get(namespacedKey);
    if (cached !== null && cached !== undefined) return cached;
  } catch (error) {
    logger.warn?.("Redis read failed; using source of truth", {
      key: namespacedKey,
      error: error?.message,
    });
  }

  if (inFlight.has(namespacedKey)) return inFlight.get(namespacedKey);

  const pending = (async () => {
    const value = await fetcher();

    if (!shouldCache(value)) return value;

    try {
      await client.set(namespacedKey, value, { ex: ttlSeconds });
    } catch (error) {
      logger.warn?.("Redis write failed; returning source value", {
        key: namespacedKey,
        error: error?.message,
      });
    }
    return value;
  })();

  inFlight.set(namespacedKey, pending);
  try {
    return await pending;
  } finally {
    inFlight.delete(namespacedKey);
  }
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

export const cacheDeletePrefix = async ({
  prefix,
  client = redis,
  logger = console,
}) => {
  if (!client?.scan) return;

  const pattern = `${redisKey(prefix)}*`;
  let cursor = "0";

  try {
    do {
      const page = await client.scan(cursor, {
        match: pattern,
        count: 100,
      });

      cursor = page.cursor;
      if (page.keys.length) {
        await client.del(...page.keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    logger.warn?.("Redis prefix invalidation failed", {
      prefix: pattern,
      error: error?.message,
    });
  }
};
