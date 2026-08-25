import "dotenv/config";
import * as http from "node:http";
import { Contract, JsonRpcProvider, Wallet, isHexString } from "ethers";

const ABI = [
  "function issueId(bytes32 idHash, bytes32 tripHash, uint64 issuedAt, uint64 expiresAt, uint8 version)",
  "function extendId(bytes32 idHash, uint64 expiresAt)",
  "function revokeId(bytes32 idHash, uint8 reasonCode)",
  "function verifyId(bytes32 idHash) view returns (uint8 status, address issuer, uint64 issuedAt, uint64 expiresAt, uint8 version)",
  "function appendDataSnapshot(bytes32 idHash, bytes32 payloadHash, bytes encryptedPayload, uint32 sequence, uint8 snapshotType)",
  "function getDataSnapshotCount(bytes32 idHash) view returns (uint256)",
  "function getLatestDataSnapshot(bytes32 idHash) view returns (bytes32 payloadHash, bytes encryptedPayload, uint64 anchoredAt, uint32 sequence, uint8 snapshotType)",
];

const rpcUrl = process.env.CHAIN_RPC_URL || "http://127.0.0.1:8545";
const contractAddress = process.env.CONTRACT_ADDRESS || process.env.address;
const privateKey = process.env.ISSUER_PRIVATE_KEY || process.env.privateKey;
const apiKey = process.env.GATEWAY_API_KEY;
// Render requires a public web service to bind to 0.0.0.0 and to the injected PORT.
// Do not allow a production GATEWAY_HOST override to accidentally bind to localhost.
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : (process.env.GATEWAY_HOST || "0.0.0.0");
const port = Number(process.env.PORT || process.env.GATEWAY_PORT || 4100);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid gateway port: ${process.env.PORT || process.env.GATEWAY_PORT || "4100"}`);
}
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

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const readinessSnapshot = async () => {
  const timeoutMs = Number(process.env.GATEWAY_READINESS_TIMEOUT_MS || 5000);
  const network = await withTimeout(provider.getNetwork(), timeoutMs, "Blockchain RPC readiness check timed out");
  const actualChainId = Number(network.chainId);
  const code = await withTimeout(provider.getCode(contractAddress), timeoutMs, "Contract readiness check timed out");
  const chainMatches = expectedChainId === undefined || expectedChainId === actualChainId;
  const contractDeployed = code !== "0x";
  return {
    ok: chainMatches && contractDeployed,
    service: "kavach-blockchain-gateway",
    message: chainMatches && contractDeployed ? "Blockchain gateway is ready" : "Blockchain gateway is not ready",
    chainId: actualChainId,
    expectedChainId: expectedChainId ?? null,
    chainMatches,
    contractAddress,
    contractDeployed,
  };
};

const LIVENESS_PATHS = new Set(["/", "/health", "/healthz"]);
const READINESS_PATHS = new Set(["/ready", "/readiness"]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // Render port/liveness probes must receive an immediate HTTP response. Do not make
    // liveness depend on Sepolia/RPC availability; blockchain readiness is exposed separately.
    if ((req.method === "GET" || req.method === "HEAD") && LIVENESS_PATHS.has(url.pathname)) {
      if (req.method === "HEAD") {
        res.writeHead(200, {
          "content-type": "application/json",
          "cache-control": "no-store",
        });
        return res.end();
      }
      return json(res, 200, {
        ok: true,
        service: "kavach-blockchain-gateway",
        message: "Blockchain gateway process is running",
        status: "online",
        readiness: "/ready",
      });
    }

    if ((req.method === "GET" || req.method === "HEAD") && READINESS_PATHS.has(url.pathname)) {
      try {
        const readiness = await readinessSnapshot();
        const status = readiness.ok ? 200 : 503;
        if (req.method === "HEAD") {
          res.writeHead(status, {
            "content-type": "application/json",
            "cache-control": "no-store",
          });
          return res.end();
        }
        return json(res, status, readiness);
      } catch (error: any) {
        if (req.method === "HEAD") {
          res.writeHead(503, {
            "content-type": "application/json",
            "cache-control": "no-store",
          });
          return res.end();
        }
        return json(res, 503, {
          ok: false,
          service: "kavach-blockchain-gateway",
          message: "Blockchain gateway process is online but chain readiness check failed",
          code: "CHAIN_NOT_READY",
          details: String(error?.message || error).slice(0, 300),
        });
      }
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
    if (req.method === "POST" && url.pathname === "/v1/snapshots/append") {
      const body = await readBody(req);
      const idHash = bytes32(body.idHash, "idHash");
      const payloadHash = bytes32(body.payloadHash, "payloadHash");
      const sequence = Number(body.sequence);
      const currentCount = Number(await contract.getDataSnapshotCount(idHash));
      if (currentCount >= sequence) return json(res, 200, { txHash: null, idempotent: true, sequence });
      const tx = await contract.appendDataSnapshot(idHash, payloadHash, body.ciphertext, sequence, Number(body.snapshotType));
      const receipt = await tx.wait();
      return json(res, 200, { txHash: receipt.hash, sequence });
    }
    const snapshotMatch = url.pathname.match(/^\/v1\/snapshots\/(0x[a-fA-F0-9]{64})\/latest$/);
    if (req.method === "GET" && snapshotMatch) {
      const [payloadHash, ciphertext, anchoredAt, sequence, snapshotType] = await contract.getLatestDataSnapshot(snapshotMatch[1]);
      return json(res, 200, { payloadHash, ciphertext, anchoredAt: Number(anchoredAt), sequence: Number(sequence), snapshotType: Number(snapshotType) });
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
server.on("error", (error) => {
  console.error("[blockchain-gateway] HTTP server error", error);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  const address = server.address();
  console.log(`[blockchain-gateway] listening on http://${host}:${port}`);
  console.log("[blockchain-gateway] bound address", address);
  console.log("[blockchain-gateway] liveness endpoints: /, /health, /healthz; readiness: /ready");
});
