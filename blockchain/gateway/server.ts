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
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.ISSUER_PRIVATE_KEY;
const apiKey = process.env.GATEWAY_API_KEY;
const host = process.env.GATEWAY_HOST || "127.0.0.1";
const port = Number(process.env.GATEWAY_PORT || 4100);
if (!contractAddress || !privateKey || !apiKey) throw new Error("CONTRACT_ADDRESS, ISSUER_PRIVATE_KEY and GATEWAY_API_KEY are required");

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
  if (typeof value !== "string" || !isHexString(value, 32)) throw new Error(`${name} must be bytes32`);
  return value;
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.headers["x-kavach-chain-key"] !== apiKey) return json(res, 401, { error: "UNAUTHORIZED" });
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/health") {
      const network = await provider.getNetwork();
      return json(res, 200, { ok: true, chainId: Number(network.chainId), contractAddress });
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
    return json(res, 404, { error: "NOT_FOUND" });
  } catch (error: any) {
    return json(res, 500, { error: String(error?.shortMessage || error?.message || error).slice(0, 500) });
  }
});
server.listen(port, host, () => console.log(`[blockchain-gateway] listening on http://${host}:${port}`));
