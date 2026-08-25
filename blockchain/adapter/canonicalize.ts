/**
 * blockchain/adapter/canonicalize.ts
 *
 * Deterministic, versioned JSON canonicalization — the single function
 * every other module hashes through, so two callers of the same logical
 * payload always produce byte-identical input to SHA-256.
 *
 * Equivalent to Python's:
 *   json.dumps({"version": v, "data": payload}, sort_keys=True, separators=(",", ":"))
 */

import type { JsonPrimitive } from "./types";

/**
 * Recursively validates that a value contains only JSON-primitive types.
 * Throws a TypeError early rather than silently calling .toString() on
 * something like a Date, which would break determinism across
 * timezones/formats.
 */
function assertJsonPrimitive(value: unknown, path: string): asserts value is JsonPrimitive {
  if (value === null) return;

  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") {
    if (t === "number" && !Number.isFinite(value as number)) {
      throw new TypeError(
        `canonicalize: non-finite number at "${path}" — NaN/Infinity is not deterministic JSON`
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => assertJsonPrimitive(item, `${path}[${i}]`));
    return;
  }

  if (t === "object") {
    // Explicitly reject Date, Map, Set, class instances, etc. — only
    // plain objects are allowed.
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw new TypeError(
        `canonicalize: non-plain-object at "${path}" (got ${
          (value as object)?.constructor?.name ?? typeof value
        }) — normalize to a primitive before hashing (e.g. Date -> unix epoch seconds integer)`
      );
    }
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      assertJsonPrimitive(v, `${path}.${key}`);
    }
    return;
  }

  throw new TypeError(
    `canonicalize: unsupported type "${t}" at "${path}" — payload must contain only JSON primitives`
  );
}

/**
 * Deterministically stringifies a value with keys sorted lexicographically
 * at every nesting level and zero whitespace. This is the TypeScript
 * equivalent of Python's json.dumps(..., sort_keys=True, separators=(",", ":")).
 *
 * Implemented by hand (no external dependency) so the canonicalization
 * algorithm is fully auditable in this one file.
 */
function stableStringify(value: JsonPrimitive): string {
  if (value === null) return "null";

  const t = typeof value;
  if (t === "number" || t === "boolean") {
    return String(value);
  }
  if (t === "string") {
    return JSON.stringify(value); // handles escaping correctly
  }

  if (Array.isArray(value)) {
    return "[" + value.map((item) => stableStringify(item)).join(",") + "]";
  }

  // Plain object: sort keys lexicographically (UTF-16 code unit order,
  // matching Python's default str comparison for the ASCII-range keys
  // used throughout this schema).
  const obj = value as { [key: string]: JsonPrimitive };
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map(
    (key) => JSON.stringify(key) + ":" + stableStringify(obj[key])
  );
  return "{" + entries.join(",") + "}";
}

/**
 * Deterministic, versioned JSON canonicalization before hashing.
 *
 * @param payload - JSON-primitive data to canonicalize. Timestamps must
 *   already be normalized to integer Unix epoch seconds by the caller —
 *   this function does not parse dates.
 * @param version - schema/contract version tag, embedded in the envelope
 *   so a future field addition never silently invalidates old proofs.
 * @returns UTF-8 encoded Buffer of the canonical envelope, ready for
 *   hashing (optionally salting first).
 * @throws TypeError if payload contains any non-JSON-primitive value.
 */
export function canonicalize(
  payload: Record<string, JsonPrimitive>,
  version: string
): Buffer {
  assertJsonPrimitive(payload, "data");
  assertJsonPrimitive(version, "version");

  const envelope: { version: JsonPrimitive; data: JsonPrimitive } = {
    version,
    data: payload,
  };

  const serialized = stableStringify(envelope);
  return Buffer.from(serialized, "utf-8");
}
