import crypto from "node:crypto";
import { environment } from "../../config/environment.js";

const toBytes32 = (value) => `0x${crypto.createHash("sha256").update(value).digest("hex")}`;
export const hashCredential = ({ type, publicId, tripId, tokenId }) =>
  toBytes32(`kavach:v1:${type}:${publicId}:${tripId}:${tokenId}`);
export const hashTrip = (tripId) => toBytes32(`kavach:v1:trip:${tripId}`);

export const blockchainFailure = (error) => {
  const code = error?.code || "BLOCKCHAIN_UNAVAILABLE";
  const status = error?.status || null;
  const raw = String(error?.message || error || "Blockchain request failed");

  if (error?.name === "TimeoutError" || error?.name === "AbortError") {
    return { code: "BLOCKCHAIN_TIMEOUT", message: "Blockchain gateway timed out", retryable: true, status };
  }
  if (["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"].includes(error?.cause?.code) || /fetch failed|network/i.test(raw)) {
    return { code: "BLOCKCHAIN_GATEWAY_UNREACHABLE", message: "Blockchain gateway is unreachable", retryable: true, status };
  }
  const retryable = status == null || status >= 500 || ["CHAIN_RPC_UNAVAILABLE", "CHAIN_NONCE_ERROR", "ISSUER_INSUFFICIENT_FUNDS"].includes(code);
  return { code, message: raw.slice(0, 500), retryable, status };
};

const callGateway = async (path, { method = "POST", body } = {}) => {
  if (!environment.BLOCKCHAIN_ENABLED) return { disabled: true, status: "DISABLED" };
  let response;
  try {
    response = await fetch(`${environment.BLOCKCHAIN_GATEWAY_URL.replace(/\/$/, "")}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-kavach-chain-key": environment.BLOCKCHAIN_GATEWAY_KEY,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const failure = blockchainFailure(error);
    const wrapped = new Error(failure.message, { cause: error });
    Object.assign(wrapped, failure);
    throw wrapped;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const gatewayError = payload?.error;
    const message = typeof gatewayError === "string"
      ? gatewayError
      : gatewayError?.message || `Blockchain gateway returned HTTP ${response.status}`;
    const error = new Error(message);
    error.code = gatewayError?.code || `BLOCKCHAIN_GATEWAY_HTTP_${response.status}`;
    error.status = response.status;
    throw error;
  }
  if (payload === null) {
    const error = new Error("Blockchain gateway returned an invalid JSON response");
    error.code = "BLOCKCHAIN_GATEWAY_INVALID_RESPONSE";
    error.status = response.status;
    throw error;
  }
  return payload;
};

export const blockchainService = Object.freeze({
  enabled: () => environment.BLOCKCHAIN_ENABLED,
  issue({ idHash, tripId, issuedAt, expiresAt }) {
    return callGateway("/v1/credentials/issue", { body: {
      idHash,
      tripHash: hashTrip(tripId),
      issuedAt: Math.floor(new Date(issuedAt).getTime() / 1000),
      expiresAt: Math.floor(new Date(expiresAt).getTime() / 1000),
      version: environment.BLOCKCHAIN_CONTRACT_VERSION,
    } });
  },
  extend({ idHash, expiresAt }) {
    return callGateway("/v1/credentials/extend", { body: { idHash, expiresAt: Math.floor(new Date(expiresAt).getTime() / 1000) } });
  },
  revoke({ idHash, reasonCode = 1 }) {
    return callGateway("/v1/credentials/revoke", { body: { idHash, reasonCode } });
  },
  async verify(idHash) {
    const result = await callGateway(`/v1/credentials/${encodeURIComponent(idHash)}`, { method: "GET" });
    return { ...result, enabled: true };
  },
});
