import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";

import { ApiError } from "../../common/errors/ApiError.js";
import { environment } from "../../config/environment.js";
import { blockchainService, hashCredential } from "../../integrations/blockchain/blockchain.service.js";
import { blockchainQueue } from "../../integrations/blockchain/blockchain.queue.js";
import { credentialRepository } from "./credential.repository.js";

const publicId = (prefix) => `KAV-${prefix}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
const tokenId = () => crypto.randomBytes(24).toString("base64url");
const active = (credential, now = new Date()) => Boolean(
  credential && !credential.revokedAt && new Date(credential.expiresAt) > now,
);
const memberOf = (trip, userId) => trip?.touristId === userId || Boolean(trip?.group?.members?.some((m) => m.userId === userId));

const tokenLifetimeSeconds = (credential) => Math.max(1, Math.floor((new Date(credential.expiresAt).getTime() - Date.now()) / 1000));

const signToken = (credential, type) => jwt.sign(
  { typ: `KAVACH_${type}`, cid: credential.id, jti: credential.tokenId },
  environment.QR_TOKEN_SECRET,
  {
    issuer: environment.JWT_ISSUER,
    audience: "kavach-credential-verifier",
    expiresIn: tokenLifetimeSeconds(credential),
  },
);

const signGroupJoinToken = (credential) => jwt.sign(
  { typ: "KAVACH_GROUP_JOIN", cid: credential.id, jti: credential.tokenId },
  environment.QR_TOKEN_SECRET,
  {
    issuer: environment.JWT_ISSUER,
    audience: "kavach-group-join",
    expiresIn: tokenLifetimeSeconds(credential),
  },
);

const parseChainError = (value) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return { code: "BLOCKCHAIN_ERROR", message: String(value).slice(0, 500), retryable: true };
};

const decorate = async (credential, type) => {
  if (!credential) return null;
  const isActive = active(credential);
  const token = isActive ? signToken(credential, type) : null;
  const verificationUrl = token ? `${environment.PUBLIC_APP_URL.replace(/\/$/, "")}/verify/${token}` : null;
  return {
    id: credential.id,
    type,
    publicId: credential.publicId,
    issuedAt: credential.issuedAt,
    expiresAt: credential.expiresAt,
    revokedAt: credential.revokedAt,
    active: isActive,
    blockchainStatus: credential.chainStatus,
    blockchainTxHash: credential.chainTxHash,
    blockchainError: parseChainError(credential.chainError),
    verificationUrl,
    groupJoinQrPayload: type === "GROUP" && isActive ? `KAVACH_GROUP_JOIN:${signGroupJoinToken(credential)}` : null,
    qrDataUrl: verificationUrl ? await QRCode.toDataURL(verificationUrl, { width: 320, margin: 1 }) : null,
  };
};

const enqueueIssue = async (credential, type, tripId) => blockchainQueue.enqueue({
  operation: "ISSUE",
  entityType: type,
  entityId: credential.id,
  payloadHash: credential.chainHash,
  extraArgs: { tripId, issuedAt: credential.issuedAt, expiresAt: credential.expiresAt },
});

const retryFailedAnchor = async (credential, type, reload) => {
  if (!credential || credential.chainStatus !== "FAILED" || !environment.BLOCKCHAIN_ENABLED) return credential;
  const requeued = await blockchainQueue.retryFailed(type, credential.id);
  return requeued ? reload() : credential;
};

export const credentialService = Object.freeze({
  async ensureIndividual(tripId, userId) {
    const trip = await credentialRepository.findTrip(tripId);
    if (!trip || !memberOf(trip, userId)) throw ApiError.notFound("Trip not found", { code: "TRIP_NOT_FOUND" });
    const existing = await credentialRepository.findIndividual(tripId, userId);
    if (existing && active(existing)) return decorate(existing, "INDIVIDUAL");

    const pub = publicId("T");
    const jti = tokenId();
    const now = new Date();
    const chainHash = hashCredential({ type: "INDIVIDUAL", publicId: pub, tripId, tokenId: jti });
    const credential = existing
      ? await credentialRepository.updateIndividual(existing.id, { publicId: pub, tokenId: jti, chainHash, issuedAt: now, expiresAt: trip.plannedEndAt, revokedAt: null, chainStatus: environment.BLOCKCHAIN_ENABLED ? "PENDING" : "DISABLED", chainTxHash: null, chainError: null })
      : await credentialRepository.createIndividual({ tripId, userId, publicId: pub, tokenId: jti, chainHash, issuedAt: now, expiresAt: trip.plannedEndAt, chainStatus: environment.BLOCKCHAIN_ENABLED ? "PENDING" : "DISABLED" });
    await enqueueIssue(credential, "INDIVIDUAL", tripId);
    return decorate(credential, "INDIVIDUAL");
  },

  async ensureGroup(groupId, requestingUserId) {
    let existing = await credentialRepository.findGroupCredential(groupId);
    if (!existing) throw ApiError.notFound("Group credential is not initialized", { code: "GROUP_CREDENTIAL_NOT_FOUND" });
    if (!existing.group.members.some((m) => m.userId === requestingUserId)) throw ApiError.forbidden("Group membership required", { code: "GROUP_MEMBERSHIP_REQUIRED" });
    existing = await retryFailedAnchor(existing, "GROUP", () => credentialRepository.findGroupCredential(groupId));
    return decorate(existing, "GROUP");
  },

  async createGroupCredential({ groupId, tripId, expiresAt }) {
    const existing = await credentialRepository.findGroupCredential(groupId);
    if (existing) return decorate(existing, "GROUP");
    const pub = publicId("G");
    const jti = tokenId();
    const now = new Date();
    const chainHash = hashCredential({ type: "GROUP", publicId: pub, tripId, tokenId: jti });
    const credential = await credentialRepository.createGroup({ groupId, tripId, publicId: pub, tokenId: jti, chainHash, issuedAt: now, expiresAt, chainStatus: environment.BLOCKCHAIN_ENABLED ? "PENDING" : "DISABLED" });
    await enqueueIssue(credential, "GROUP", tripId);
    return decorate(credential, "GROUP");
  },

  async getMyIndividual(tripId, userId) {
    let credential = await credentialRepository.findIndividual(tripId, userId);
    if (!credential) return this.ensureIndividual(tripId, userId);
    credential = await retryFailedAnchor(credential, "INDIVIDUAL", () => credentialRepository.findIndividual(tripId, userId));
    return decorate(credential, "INDIVIDUAL");
  },

  async getGroup(groupId, userId) { return this.ensureGroup(groupId, userId); },

  async extendTrip(tripId, expiresAt) {
    const [individuals, group] = await credentialRepository.listTripCredentials(tripId);
    const all = [...individuals.map((c) => ["INDIVIDUAL", c]), ...(group ? [["GROUP", group]] : [])];
    for (const [type, credential] of all) {
      if (credential.revokedAt) continue;
      const updated = type === "GROUP"
        ? await credentialRepository.updateGroup(credential.id, { expiresAt, chainStatus: environment.BLOCKCHAIN_ENABLED ? "PENDING" : "DISABLED" })
        : await credentialRepository.updateIndividual(credential.id, { expiresAt, chainStatus: environment.BLOCKCHAIN_ENABLED ? "PENDING" : "DISABLED" });
      await blockchainQueue.enqueue({ operation: "EXTEND", entityType: type, entityId: updated.id, payloadHash: updated.chainHash, extraArgs: { expiresAt } });
    }
  },

  async revokeTrip(tripId, reasonCode = 1) {
    const now = new Date();
    const [individuals, group] = await credentialRepository.listTripCredentials(tripId);
    const all = [...individuals.map((c) => ["INDIVIDUAL", c]), ...(group ? [["GROUP", group]] : [])];
    for (const [type, credential] of all) {
      if (credential.revokedAt) continue;
      const updated = type === "GROUP"
        ? await credentialRepository.updateGroup(credential.id, { revokedAt: now, chainStatus: environment.BLOCKCHAIN_ENABLED ? "PENDING" : "DISABLED" })
        : await credentialRepository.updateIndividual(credential.id, { revokedAt: now, chainStatus: environment.BLOCKCHAIN_ENABLED ? "PENDING" : "DISABLED" });
      await blockchainQueue.enqueue({ operation: "REVOKE", entityType: type, entityId: updated.id, payloadHash: updated.chainHash, extraArgs: { reasonCode } });
    }
  },

  async revokeIndividual(tripId, userId, reasonCode = 2) {
    const credential = await credentialRepository.findIndividual(tripId, userId);
    if (!credential || credential.revokedAt) return;
    const updated = await credentialRepository.updateIndividual(credential.id, { revokedAt: new Date(), chainStatus: environment.BLOCKCHAIN_ENABLED ? "PENDING" : "DISABLED" });
    await blockchainQueue.enqueue({ operation: "REVOKE", entityType: "INDIVIDUAL", entityId: updated.id, payloadHash: updated.chainHash, extraArgs: { reasonCode } });
  },

  async verifyToken(token) {
    let payload;
    try {
      payload = jwt.verify(token, environment.QR_TOKEN_SECRET, { issuer: environment.JWT_ISSUER, audience: "kavach-credential-verifier" });
    } catch (error) {
      throw ApiError.badRequest("QR credential is invalid or expired", { code: "CREDENTIAL_TOKEN_INVALID" });
    }
    const type = payload.typ === "KAVACH_GROUP" ? "GROUP" : payload.typ === "KAVACH_INDIVIDUAL" ? "INDIVIDUAL" : null;
    if (!type) throw ApiError.badRequest("Unsupported QR credential", { code: "CREDENTIAL_TOKEN_INVALID" });
    const credential = type === "GROUP"
      ? await credentialRepository.findGroupCredentialById(payload.cid)
      : await credentialRepository.findIndividualById(payload.cid);
    if (!credential || credential.tokenId !== payload.jti) throw ApiError.badRequest("QR credential has been replaced", { code: "CREDENTIAL_REPLACED" });

    const isActive = active(credential);
    let chain = { enabled: environment.BLOCKCHAIN_ENABLED, status: credential.chainStatus };
    if (environment.BLOCKCHAIN_ENABLED && credential.chainStatus === "CONFIRMED") {
      try { chain = await blockchainService.verify(credential.chainHash); }
      catch { chain = { enabled: true, status: "UNAVAILABLE" }; }
    }
    const trip = type === "GROUP" ? credential.group.trip : credential.trip;
    return {
      valid: isActive && ["PLANNED", "ACTIVE"].includes(trip.status) && (!chain.enabled || chain.status === "ACTIVE"),
      type,
      publicId: credential.publicId,
      trip: { id: trip.id, locationName: trip.locationName, status: trip.status, endsAt: trip.plannedEndAt },
      memberCount: type === "GROUP" ? credential.group.members.length : undefined,
      expiresAt: credential.expiresAt,
      blockchain: { status: chain.status, verified: chain.enabled && chain.status === "ACTIVE", txHash: credential.chainTxHash },
    };
  },
});
