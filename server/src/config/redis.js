import { environment } from "./environment.js";

export const createRedisClient = ({
  config = environment,
  fetchImpl = globalThis.fetch,
} = {}) => {
  if (
    !config.REDIS_ENABLED ||
    !config.UPSTASH_REDIS_REST_URL ||
    !config.UPSTASH_REDIS_REST_TOKEN ||
    typeof fetchImpl !== "function"
  ) return null;

  const endpoint = config.UPSTASH_REDIS_REST_URL.replace(/\/$/, "");

  const command = async (...parts) => {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parts.map((part) => String(part))),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      throw new Error(payload.error || `Upstash Redis returned HTTP ${response.status}`);
    }
    return payload.result;
  };

  return Object.freeze({
    async get(key) {
      const value = await command("GET", key);
      if (value == null) return null;
      try { return JSON.parse(value); } catch { return value; }
    },
    async set(key, value, { ex } = {}) {
      const serialized = JSON.stringify(value);
      return ex
        ? command("SET", key, serialized, "EX", ex)
        : command("SET", key, serialized);
    },
    async del(...keys) {
      return keys.length ? command("DEL", ...keys) : 0;
    },
    async scan(cursor = "0", { match, count = 100 } = {}) {
      const parts = ["SCAN", cursor];
      if (match) parts.push("MATCH", match);
      if (count) parts.push("COUNT", count);
      const result = await command(...parts);
      return {
        cursor: String(result?.[0] ?? "0"),
        keys: Array.isArray(result?.[1]) ? result[1] : [],
      };
    },
    ping() {
      return command("PING");
    },
  });
};

export const redis = createRedisClient();

export const redisKey = (...parts) =>
  [environment.REDIS_KEY_PREFIX, ...parts]
    .filter((part) => part !== undefined && part !== null && part !== "")
    .map(String)
    .join(":");

export default redis;
