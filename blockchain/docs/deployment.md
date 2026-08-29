# Blockchain Gateway Deployment

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Deploy `blockchain/` as a separate service from the main API. Set chain RPC, chain ID, contract address, issuer private key and `GATEWAY_API_KEY` only on the gateway. Set the matching secret as `BLOCKCHAIN_GATEWAY_KEY` on `server/`.

Production gateway health may be public, but credential operations require the shared key. The main backend should point `BLOCKCHAIN_GATEWAY_URL` to the deployed service URL.
