import crypto from "node:crypto";
import { environment } from "../../config/environment.js";

const toBytes32 = (value) => `0x${crypto.createHash("sha256").update(value).digest("hex")}`;
export const hashCredential = ({ type, publicId, tripId, tokenId }) =>
  toBytes32(`kavach:v1:${type}:${publicId}:${tripId}:${tokenId}`);
export const hashTrip = (tripId) => toBytes32(`kavach:v1:trip:${tripId}`);

const callGateway = async (path, { method = "POST", body } = {}) => {
  if (!environment.BLOCKCHAIN_ENABLED) return { disabled: true, status: "DISABLED" };
  const response = await fetch(`${environment.BLOCKCHAIN_GATEWAY_URL.replace(/\/$/, "")}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-kavach-chain-key": environment.BLOCKCHAIN_GATEWAY_KEY,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `Blockchain gateway returned ${response.status}`);
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
