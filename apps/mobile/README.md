# Mobile (Expo SDK 57) — offline on-device

Native iOS/Android client for 1day. Data lives in **SQLite on the device** — no backend, no Wi‑Fi, no PC required at runtime.

## Dev (Expo)

```bash
pnpm --filter mobile start
```

## Server address in the app

The backend address can also be set at runtime, with no rebuild:

- On the login screen tap **Server**, or in **Profile → Server** when signed in
- Enter `http://<IP>` (Docker via nginx on port 80) or `http://<IP>:3000` (backend directly); the scheme is optional
- The app checks `GET /api/health` before saving and keeps the old address if the check fails
- A saved address takes priority over `EXPO_PUBLIC_API_URL` and auto-detection; **Reset to auto** removes it
- Changing the server signs you out, because the token belongs to the previous server

## Auth

- Login/register return `{ user, token }`
- Token stored in `expo-secure-store`
- Authenticated requests send `Authorization: Bearer <token>`
- Network errors include the current API base URL so you can verify the host
