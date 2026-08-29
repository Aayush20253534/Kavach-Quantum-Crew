# Docker and Local Service Topology

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

The main backend can run directly with Node or inside Docker. Docker configuration must still provide the same runtime environment described in `.env.example`.

Recommended local topology:

```text
client :5173
server :4000
Rakshak AI :4200
FastAPI trip planner :4300
blockchain gateway :4100
PostgreSQL :5432
```

Provider keys and issuer private keys must be injected as environment secrets, not baked into images. The blockchain issuer key belongs only to the blockchain service.
