# Taking the Blockchain Trust Layer Online — Render Deployment Guide

> **Current workflow:** Read [`workflow.md`](workflow.md) first for the repository's live credential integration and terminology. This document then covers its narrower deployment/design topic.


> **Documentation status (24 Aug 2026):** Retained as design/deployment history. The current server integration uses the isolated authenticated HTTP gateway (`blockchain/gateway/server.ts`), not an in-process adapter import into `server/`.


### SIH25002 — Smart Tourist Safety Monitoring & Incident Response System

> Audience: the backend developer hosting the platform on Render. This document covers **only** what changes when you move the blockchain trust layer from your laptop (local Hardhat node) to a publicly reachable, hosted deployment. Everything about the contract, adapter functions, and HTTP contract routes stays exactly as already documented — this is purely the "how do I run this online" layer.

---

## 1. The core decision: you cannot host "local Hardhat" the way you run it locally

On your laptop, `npx hardhat node` gives you a private, in-memory chain that only your own machine can reach at `127.0.0.1:8545`. That's perfect for development, but it **does not work for a publicly hosted site** for two reasons:

1. Render's free/starter web services restart, redeploy, and can spin down on inactivity — an in-memory Hardhat chain's entire state (every issued ID, every anchor) is wiped on every restart.
2. Even a *persistent* Hardhat node running as its own Render service would only be reachable by your own backend, not by any real, independent, third-party chain — which defeats the "inter-agency verification" story (anyone should be able to independently verify a proof against a real ledger, not just your own process).

**Decision: deploy `TrustAnchor.sol` to a public testnet instead.** This is exactly the "optional, secondary" path already described in Invariant 7 of the blueprint — for a hosted demo, it stops being optional and becomes the primary path. Recommended networks (both free, both fast, both well-supported by Hardhat/ethers):

| Network | Why |
|---|---|
| **Polygon Amoy** (Polygon's testnet) | Very low/near-zero gas, fast confirmations, generous public faucets — good fit for a hackathon demo hitting the chain frequently. |
| **Ethereum Sepolia** | Most widely recognized name if a judge wants to "just Google it," but slightly slower blocks and faucets can be stingier. |

Either works with zero code changes — you already have the `testnet` network slot wired into `hardhat.config.ts` from `config/.env.example`. Pick one and treat the steps below as the same either way.

---

## 2. What you need before touching Render

### 2.1 An RPC provider (how your app actually talks to the chain)

You cannot point `CHAIN_RPC_URL` at a public testnet without an RPC endpoint. Sign up (free tier is enough) with one of:

- **Alchemy** (alchemy.com) — recommended, generous free tier, dashboards for monitoring requests.
- **Infura** (infura.io) — equally fine, similar setup.
- **Ankr** (ankr.com) — no-signup public RPC endpoints available too, slightly less reliable under load.

After creating an app/project for your chosen testnet, copy the HTTPS RPC URL — it looks like:
```
https://polygon-amoy.g.alchemy.com/v2/<your-api-key>
```

### 2.2 A dedicated deployer/issuer wallet — never reuse a personal wallet

Generate a **brand-new** wallet used only for this project:

```bash
node -e "const {Wallet} = require('ethers'); const w = Wallet.createRandom(); console.log('address:', w.address); console.log('privateKey:', w.privateKey);"
```

- Save the `address` and `privateKey` somewhere safe (a password manager, not a text file in the repo).
- This address becomes your contract's `admin` and first `authorizedIssuer` (per `TrustAnchor.sol`'s constructor).
- **This is the key that will live in Render's environment variables.** Treat it as sensitive even though it only ever holds testnet funds with zero real value.

### 2.3 Testnet funds (to pay gas)

Your issuer wallet needs a small amount of testnet currency to pay gas for `issueId`/`anchorEvidence`/etc. transactions. Get it free from a faucet:

- Polygon Amoy faucet: `faucet.polygon.technology` (select Amoy).
- Sepolia faucet: `sepoliafaucet.com` or Alchemy's own Sepolia faucet.

Paste your issuer wallet's address, request funds, wait a minute, confirm the balance shows up (the faucet site or a block explorer like `amoy.polygonscan.com` / `sepolia.etherscan.io` will show it).

**Set a calendar reminder or monitoring alert** — testnet faucets have limits, and if your issuer wallet runs out of gas mid-demo, every anchor transaction will fail at submission. Check the balance again the morning of judging.

---

## 3. Deploying the contract to the testnet

This step happens **once**, from your own machine (not from Render) — you don't need Render running yet to do this.

### 3.1 Set your local `.env` to point at the testnet

In `blockchain/.env` (your real, local, gitignored file):

```bash
CHAIN_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/<your-api-key>
CHAIN_ID=80002
ISSUER_PRIVATE_KEY=<the private key from step 2.2>
CONTRACT_VERSION=trust-anchor-v1
# CONTRACT_ADDRESS stays blank until after deployment
```

(`CHAIN_ID=80002` is Polygon Amoy's chain ID; Sepolia's is `11155111` — use whichever matches your chosen network.)

### 3.2 Confirm the `testnet` network is active in `hardhat.config.ts`

Per the blueprint's §6 spec, the `testnet` network entry only activates when `CHAIN_RPC_URL`, `ISSUER_PRIVATE_KEY`, and `CHAIN_ID` are all present — with the `.env` above set, it will now show up.

### 3.3 Deploy

```bash
cd blockchain
npx hardhat run scripts/deploy.ts --network testnet
```

This:
- Compiles and deploys `TrustAnchor.sol` to the public testnet.
- Waits for the deployment transaction to be mined (this takes real wall-clock time — seconds on Polygon Amoy, up to a minute on Sepolia — unlike the instant local chain).
- Writes `blockchain/deployments/testnet.json` with the real contract address.
- Prints the `CONTRACT_ADDRESS=` line to copy.

### 3.4 Verify it deployed correctly

Look up the printed contract address on the network's block explorer (`amoy.polygonscan.com` or `sepolia.etherscan.io`) and confirm a contract-creation transaction exists from your issuer wallet. This is also a good moment to run your seed script once against the testnet to sanity-check everything end to end:

```bash
npx ts-node scripts/seedDemo.ts
```

---

## 4. Hosting the backend (which hosts the adapter) on Render

Since the adapter is an in-process TypeScript module inside your Node/Express backend (not a separate service), "hosting the blockchain layer" really just means: **hosting your backend correctly, with the right environment variables.**

### 4.1 Service type

Use a Render **Web Service** for the Express app (the same one that already serves your REST API) — not a separate service for blockchain. Point it at your backend's build/start commands as normal (e.g. `npm run build` / `npm start`).

### 4.2 Environment variables to set in Render's dashboard

Go to your Web Service → **Environment** tab and add these (mark the private key as a **secret**, Render supports this):

| Key | Value |
|---|---|
| `CHAIN_RPC_URL` | your Alchemy/Infura/Ankr testnet URL |
| `CHAIN_ID` | `80002` (Amoy) or `11155111` (Sepolia) |
| `CONTRACT_ADDRESS` | the address printed in step 3.3 |
| `CONTRACT_VERSION` | `trust-anchor-v1` |
| `ISSUER_PRIVATE_KEY` | the private key from step 2.2 — **mark as secret/sensitive in Render**, never log it |
| `DATABASE_URL` | your existing Neon/managed Postgres URL (unrelated to blockchain, but the job-queue table lives here) |

**Never commit any of these to git** — this is exactly what `.env.example` (no real values) vs `.env` (gitignored, real values) already protects against locally; Render's environment variable UI is the hosted equivalent of your local `.env`.

### 4.3 Run the Prisma migration for the job-queue table

Before first deploy, make sure the `BlockchainAnchorJob` table (from the integration guide's Step 5) has been migrated into your **hosted** Postgres database, not just your local one:

```bash
DATABASE_URL=<your Neon connection string> npx prisma migrate deploy
```

Run this from your machine pointed at the production database URL, or wire it into Render's build command (`npx prisma migrate deploy && npm run build`) so it runs automatically on every deploy.

### 4.4 The worker loop on Render — important gotcha

Your `setInterval(() => runWorkerOnce(), 5000)` line, per the integration guide's Step 7, runs inside the same process as your Express server. Two things change once this is hosted:

1. **Render free-tier web services spin down after inactivity** and take a few seconds to wake on the next request. While spun down, the worker loop isn't ticking, so any `PENDING` job just waits longer — this is fine and matches the "chain outage never blocks SOS" invariant, but it does mean anchors can take longer to confirm than in your local demo. For judging day, consider a paid Render instance type that doesn't spin down, or at minimum a periodic uptime ping (e.g. a free UptimeRobot check hitting your `/health` endpoint every few minutes) to keep it warm.

2. **If you ever scale to more than one Render instance** (horizontal scaling), you'd have multiple `runWorkerOnce()` loops ticking in parallel against the same Postgres table, which risks two instances trying to submit the same job. For this hackathon's scale, **stay on a single instance** — don't enable Render's autoscaling for this service. If you outgrow that later, the fix is adding a simple row-level lock (`SELECT ... FOR UPDATE SKIP LOCKED`) in the worker's job-selection query — out of scope for now.

### 4.5 Health check endpoint

Render pings a health check URL to know your service is alive. Make sure your existing `/health` endpoint (already specified in the source blueprint's REST API contract) also reports blockchain connectivity, so a broken RPC connection is visible in Render's dashboard rather than silently failing:

```json
{
  "status": "ok",
  "database": "connected",
  "blockchain": {
    "rpcReachable": true,
    "contractAddress": "0x...",
    "network": "polygon-amoy"
  }
}
```

(Implementing this check: call `chainClient`'s provider with a lightweight read like fetching the latest block number, wrapped in a try/catch, and report `rpcReachable: false` on failure rather than crashing the health endpoint.)

---

## 5. Post-deploy verification checklist

Run through this once the Render service is live, before telling the team it's ready:

- [ ] `GET https://<your-render-url>/health` shows `blockchain.rpcReachable: true`.
- [ ] `POST .../safety-id-proof` against the **hosted** URL returns `{ reference, transactionId: null, status: "ACCEPTED" }`.
- [ ] Wait ~15–30 seconds (testnet confirmation is slower than local), then `GET .../verification/:reference` shows `status: "CONFIRMED"` with a non-null `transactionId`.
- [ ] That `transactionId` resolves to a real transaction on the block explorer for your chosen testnet.
- [ ] Run `npx ts-node adapter/privacyScan.ts` locally, pointed at the **hosted** `CONTRACT_ADDRESS`, to confirm the deployed contract still passes the on-chain inspection checklist.
- [ ] Issuer wallet balance is comfortably above what a full demo run would consume (check the block explorer).

---

## 6. What judges see differently now (update your Q&A prep)

| Question | Local-only answer | Hosted answer |
|---|---|---|
| Is this really on a blockchain? | "Local Hardhat chain for deterministic judging." | "Deployed live on Polygon Amoy testnet — here's the contract on the explorer." |
| Can I verify a proof myself? | No, only your machine can reach it. | Yes — anyone can look up the transaction/contract on the public block explorer independently, which is the actual point of an inter-agency trust anchor. |
| Why not mainnet? | N/A | Explicitly out of scope for MVP (per the source blueprint's non-goals) — a testnet demonstrates the same mechanism without spending real funds or requiring production key-management infrastructure. |

---

## 7. Rollback / redeploy notes

If you ever need to redeploy a new version of the contract (e.g. a bug found close to judging):

1. Re-run `npx hardhat run scripts/deploy.ts --network testnet` — this deploys a **new** contract at a **new** address (there is no upgrade/proxy pattern, by design, per §2's non-goals).
2. Update `CONTRACT_ADDRESS` in Render's environment variables to the new address.
3. Redeploy the Render service so it picks up the new env var.
4. **Old anchors on the previous contract address remain valid and independently verifiable** — they simply live at the old address with the old `contractVersion`. Keep `deployments/testnet.json`'s previous version around (rename it, e.g. `testnet-v1.json`) so you can still explain/demo the old proofs if asked.

---

**Everything else about the trust layer — contract logic, adapter functions, the four catalogue HTTP routes — is unchanged by hosting.** This document only covers the environment/infrastructure delta between "runs on my laptop" and "runs on Render against a public testnet."
## Gateway deployment

For the current multi-directory deployment, run `blockchain/` as a separate Render Web Service and let it connect to the already-deployed public testnet through `CHAIN_RPC_URL`. Do **not** run `npx hardhat node` on Render; an ephemeral local chain would lose state on restart and would not be reachable as the intended public trust anchor.

Render settings:

```text
Root Directory: blockchain
Build Command:  npm install && npm run build
Start Command:  npm start
Health Check:   /health
```

Keep the blockchain team's existing `CHAIN_RPC_URL`, `CHAIN_ID`, `CONTRACT_ADDRESS`, `CONTRACT_VERSION`, and `ISSUER_PRIVATE_KEY` values. The runtime also accepts the existing lowercase aliases `address` and `privateKey`. Add a new long random `GATEWAY_API_KEY`. Render supplies `PORT` automatically and the gateway binds to `0.0.0.0` there.

The main API service gets only the gateway URL/key, never the issuer private key:

```env
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_GATEWAY_URL=https://<your-blockchain-service>.onrender.com
BLOCKCHAIN_GATEWAY_KEY=<same value as GATEWAY_API_KEY>
BLOCKCHAIN_CONTRACT_VERSION=1
```

`BLOCKCHAIN_CONTRACT_VERSION=1` is the numeric `uint8` written into `TrustAnchor.issueId`; it is separate from the blockchain team's string tag `CONTRACT_VERSION=trust-anchor-v1`.

## Snapshot-enabled contract deployment

The snapshot-enabled backend requires a newly deployed contract containing `appendDataSnapshot`, `getDataSnapshotCount`, `getLatestDataSnapshot`, and `getDataSnapshot`. After deployment, update the gateway `CONTRACT_ADDRESS`, then deploy the backend with a stable `BLOCKCHAIN_DATA_ENCRYPTION_KEY` (minimum 32 characters). Test both credential verification and snapshot append/read before routing production traffic.

Changing the encryption secret is not equivalent to rotating an API token: old ciphertext becomes undecryptable unless key versioning/migration is implemented first.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

