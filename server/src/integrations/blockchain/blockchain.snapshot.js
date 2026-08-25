import crypto from "node:crypto";
import { environment } from "../../config/environment.js";

const key = () => crypto.createHash("sha256").update(environment.BLOCKCHAIN_DATA_ENCRYPTION_KEY).digest();
const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
};

export const hashSnapshot = (payload) => `0x${crypto.createHash("sha256").update(stable(payload)).digest("hex")}`;

export const encryptSnapshot = (payload) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(stable(payload), "utf8"), cipher.final()]);
  const envelope = JSON.stringify({ v: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: encrypted.toString("base64") });
  return `0x${Buffer.from(envelope, "utf8").toString("hex")}`;
};

export const decryptSnapshot = (ciphertext) => {
  const envelope = JSON.parse(Buffer.from(String(ciphertext).replace(/^0x/, ""), "hex").toString("utf8"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data, "base64")), decipher.final()]).toString("utf8"));
};
