# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## QR credentials

The Current Trip page now loads real credentials from the API instead of showing the old mock blockchain text.

- `GET /credentials/trips/:tripId/me` returns the signed individual QR.
- `GET /credentials/groups/:groupId` returns the group QR for active group members.
- `/verify/:token` is a public verification page opened by scanning either QR.
- QR images are generated server-side. The frontend only renders the returned data URI and verification URL.
- The UI reports `PENDING`, `CONFIRMED`, `FAILED`, or `DISABLED` blockchain state. `CONFIRMED` means the asynchronous anchor worker mined the proof.

Frontend configuration remains intentionally free of private blockchain settings. `VITE_PUBLIC_APP_URL` may be used for browser-facing links, while issuer keys stay inside `blockchain/.env`.
