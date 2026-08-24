# Quantum-Crew
## Blockchain-backed QR trip credentials

Kavach now issues two trip-scoped QR credentials: an **individual credential** for every active trip participant and a **group credential** for group trips. PostgreSQL stores the application record and signed QR token metadata; the blockchain stores only a salted/hash-derived proof and expiry window. No name, phone number, GPS coordinate, medical data, or government ID is written on-chain.

The three directories communicate as follows:

```text
frontend/  --HTTPS-->  server/  --internal HTTP-->  blockchain gateway  --JSON-RPC--> EVM chain
   QR UI                 DB + jobs                    issuer private key                 TrustAnchor
```

The browser never receives a blockchain private key. The backend never imports the Solidity project directly. Instead, `blockchain/gateway/server.ts` exposes a tiny authenticated internal API used by the server's asynchronous blockchain worker.

Setup order:

1. Apply Prisma migrations in `server/`.
2. Start/deploy `blockchain/TrustAnchor.sol` and run the blockchain gateway.
3. Configure the matching gateway key in `blockchain/.env` and `server/.env`.
4. Start `server/`, then `frontend/`.
5. Create a trip. The individual QR is issued automatically. Creating a group also issues a group QR; joining a group issues that member's own individual QR.
6. Completing, cancelling, leaving, being removed, or automatically expiring a trip revokes/invalidates the applicable credential. Extending a trip extends its on-chain expiry and causes fresh QR JWTs to be generated with the new expiry.


### Hosted blockchain runtime

When hosted on Render, `blockchain/` runs as a separate Web Service (`npm install && npm run build`, then `npm start`) that connects to the public RPC endpoint. The main API talks to that service through `BLOCKCHAIN_GATEWAY_URL` + `BLOCKCHAIN_GATEWAY_KEY`; the issuer private key never belongs in `server/` or `frontend/`.

## Group QR Join

Group invitations are now shared as expiring QR codes. The tourist app scans the QR, validates it with a preview API, shows the trip details for confirmation, and only then joins the group. The opaque QR token expires with the invitation and does not expose group internals or tourist data.

### Group QR join
Group join QR codes are generated from the active group credential `idHash` (`chainHash`) using `KAVACH_GROUP:<idHash>`. The backend resolves and validates the hash before allowing membership.

### Double-confirmation group joining

Group QR scans are identification, not automatic authorization. A tourist scans the compact blockchain group `idHash`, reviews the trip, and submits a join request. The trip leader must approve that request before `GroupMember` creation and individual credential issuance. This prevents a copied group QR from silently adding arbitrary authenticated users to a trip.
