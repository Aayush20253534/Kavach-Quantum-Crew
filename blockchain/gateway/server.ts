import "dotenv/config";
import * as http from "node:http";
import { Contract, JsonRpcProvider, Wallet, isHexString } from "ethers";

const ABI = [
  "function issueId(bytes32 idHash, bytes32 tripHash, uint64 issuedAt, uint64 expiresAt, uint8 version)",
  "function extendId(bytes32 idHash, uint64 expiresAt)",
  "function revokeId(bytes32 idHash, uint8 reasonCode)",
  "function verifyId(bytes32 idHash) view returns (uint8 status, address issuer, uint64 issuedAt, uint64 expiresAt, uint8 version)",
];

const rpcUrl = process.env.CHAIN_RPC_URL || "http://127.0.0.1:8545";
const contractAddress = process.env.CONTRACT_ADDRESS || process.env.address;
const privateKey = process.env.ISSUER_PRIVATE_KEY || process.env.privateKey;
const apiKey = process.env.GATEWAY_API_KEY;
// Render injects PORT and requires binding to 0.0.0.0. Local development can still override both.
const host = process.env.GATEWAY_HOST || "0.0.0.0";
const port = Number(process.env.PORT || process.env.GATEWAY_PORT || 4100);
const expectedChainId = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : undefined;
if (!contractAddress || !privateKey || !apiKey) {
  throw new Error(
    "CONTRACT_ADDRESS/address, ISSUER_PRIVATE_KEY/privateKey and GATEWAY_API_KEY are required"
  );
}

const provider = new JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const contract = new Contract(contractAddress, ABI, signer);
const json = (res: http.ServerResponse, status: number, value: unknown) => {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(value));
};
const readBody = (req: http.IncomingMessage) => new Promise<any>((resolve, reject) => {
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; if (raw.length > 32_768) reject(new Error("BODY_TOO_LARGE")); });
  req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("INVALID_JSON")); } });
  req.on("error", reject);
});
const bytes32 = (value: unknown, name: string) => {
  if (typeof value !== "string" || !isHexString(value, 32)) {
    const error = new Error(`${name} must be a 32-byte hex value`);
    (error as any).code = "INVALID_BYTES32";
    throw error;
  }
  return value;
};

const gatewayError = (error: any) => {
  const raw = String(error?.shortMessage || error?.reason || error?.message || error || "Unknown blockchain error");
  const lower = raw.toLowerCase();
  if (error?.code === "BODY_TOO_LARGE") return { status: 413, code: "BODY_TOO_LARGE", message: "Request body is too large" };
  if (error?.code === "INVALID_JSON") return { status: 400, code: "INVALID_JSON", message: "Request body must be valid JSON" };
  if (error?.code === "INVALID_BYTES32") return { status: 422, code: "INVALID_BLOCKCHAIN_HASH", message: raw };
  if (lower.includes("insufficient funds")) return { status: 503, code: "ISSUER_INSUFFICIENT_FUNDS", message: "Blockchain issuer wallet has insufficient funds for gas" };
  if (lower.includes("nonce")) return { status: 503, code: "CHAIN_NONCE_ERROR", message: "Blockchain transaction nonce could not be accepted" };
  if (lower.includes("network") || lower.includes("connect") || lower.includes("econnrefused") || lower.includes("timeout") || lower.includes("failed to fetch")) {
    return { status: 503, code: "CHAIN_RPC_UNAVAILABLE", message: "Blockchain RPC is unavailable or unreachable" };
  }
  if (lower.includes("execution reverted") || lower.includes("revert")) return { status: 409, code: "CONTRACT_REVERTED", message: raw.slice(0, 300) };
  return { status: 500, code: "BLOCKCHAIN_GATEWAY_ERROR", message: raw.slice(0, 300) };
};

const healthSnapshot = async () => {
  const network = await provider.getNetwork();
  const actualChainId = Number(network.chainId);
  const code = await provider.getCode(contractAddress);
  const chainMatches = expectedChainId === undefined || expectedChainId === actualChainId;
  const contractDeployed = code !== "0x";
  return {
    ok: chainMatches && contractDeployed,
    service: "kavach-blockchain-gateway",
    message: chainMatches && contractDeployed ? "Blockchain gateway is working" : "Blockchain gateway is not ready",
    chainId: actualChainId,
    expectedChainId: expectedChainId ?? null,
    chainMatches,
    contractAddress,
    contractDeployed,
  };
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    // Public readiness endpoints for hosting health checks and quick diagnostics.
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      const health = await healthSnapshot();
      return json(res, health.ok ? 200 : 503, health);
    }
    if (req.headers["x-kavach-chain-key"] !== apiKey) {
      return json(res, 401, { error: { code: "UNAUTHORIZED", message: "Missing or invalid blockchain gateway API key" } });
    }
    if (req.method === "POST" && url.pathname === "/v1/credentials/issue") {
      const body = await readBody(req);
      const idHash = bytes32(body.idHash, "idHash");
      try {
        const tx = await contract.issueId(idHash, bytes32(body.tripHash, "tripHash"), Number(body.issuedAt), Number(body.expiresAt), Number(body.version || 1));
        const receipt = await tx.wait();
        return json(res, 200, { txHash: receipt.hash });
      } catch (error: any) {
        if (!String(error?.shortMessage || error?.message || error).includes("ID_ALREADY_ISSUED")) throw error;
        const current = await contract.verifyId(idHash);
        if (Number(current[3]) !== Number(body.expiresAt)) throw error;
        return json(res, 200, { txHash: null, idempotent: true });
      }
    }
    if (req.method === "POST" && url.pathname === "/v1/credentials/extend") {
      const body = await readBody(req);
      const idHash = bytes32(body.idHash, "idHash");
      try {
        const tx = await contract.extendId(idHash, Number(body.expiresAt));
        const receipt = await tx.wait();
        return json(res, 200, { txHash: receipt.hash });
      } catch (error: any) {
        const current = await contract.verifyId(idHash);
        if (Number(current[3]) !== Number(body.expiresAt) || Number(current[0]) !== 0) throw error;
        return json(res, 200, { txHash: null, idempotent: true });
      }
    }
    if (req.method === "POST" && url.pathname === "/v1/credentials/revoke") {
      const body = await readBody(req);
      const idHash = bytes32(body.idHash, "idHash");
      try {
        const tx = await contract.revokeId(idHash, Number(body.reasonCode || 1));
        const receipt = await tx.wait();
        return json(res, 200, { txHash: receipt.hash });
      } catch (error: any) {
        const current = await contract.verifyId(idHash);
        if (Number(current[0]) !== 1) throw error;
        return json(res, 200, { txHash: null, idempotent: true });
      }
    }
    const match = url.pathname.match(/^\/v1\/credentials\/(0x[a-fA-F0-9]{64})$/);
    if (req.method === "GET" && match) {
      const [status, issuer, issuedAt, expiresAt, version] = await contract.verifyId(match[1]);
      const names = ["ACTIVE", "REVOKED", "EXPIRED"];
      return json(res, 200, { status: names[Number(status)] || "UNKNOWN", issuer, issuedAt: Number(issuedAt), expiresAt: Number(expiresAt), version: Number(version) });
    }
    return json(res, 404, { error: { code: "NOT_FOUND", message: "Blockchain gateway route not found" } });
  } catch (error: any) {
    const normalized = gatewayError(error);
    return json(res, normalized.status, { error: { code: normalized.code, message: normalized.message } });
  }
});
server.listen(port, host, () => console.log(`[blockchain-gateway] listening on http://${host}:${port}`));
