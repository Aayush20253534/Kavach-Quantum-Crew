# KAVACH Client

`client/` is the React 19 + Vite browser application for KAVACH. It contains role-aware surfaces for tourists, Disaster Management, System Admin, Police, Fire and Ambulance.

## Development

```bash
cp .env.example .env
npm ci
npm run dev
```

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_PUBLIC_APP_URL=http://localhost:5173
VITE_SOCKET_URL=http://localhost:4000
VITE_AI_SERVICE_URL=http://localhost:4200
```

## Current tourist trip flow

- choose destination, start/end time and `SOLO`/`GROUP` on the Trips page
- group trips create the group before planning; members join through link/QR and the leader locks membership
- planning mode is chosen once
- `Plan without AI` starts the trip immediately
- `Plan with AI` uses the already-selected destination/dates, saves the generated plan, then starts the trip immediately
- after start, AI planning cannot be changed or regenerated
- for groups, only the leader can generate; all members can view the saved plan

## State and data access

The client uses Redux Toolkit, TanStack Query, Axios and Socket.IO. Backend authorization remains authoritative; route hiding in the UI is not security enforcement.

## Quality

```bash
npm run lint
npm run build
```

See `docs/Architecture.md`, `docs/ENDPOINTS.md` and `docs/PRD.md` for current product notes.
