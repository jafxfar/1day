# Mobile (Expo SDK 57)

Native iOS/Android client for 1day.

## Setup

1. Start backend (`pnpm --filter backend dev`) on port 3000
2. Copy `.env.example` → `.env`
   - **Recommended:** leave `EXPO_PUBLIC_API_URL` unset — the app derives `http://<expo-lan-ip>:3000` from the Expo packager host (works on physical devices / Expo Go)
   - Override only when needed:
     - Android emulator: `http://10.0.2.2:3000`
     - iOS simulator: `http://localhost:3000`
     - Physical device (manual): `http://<your-lan-ip>:3000`
3. From repo root: `pnpm --filter mobile start` (restart Expo after changing `.env`)
4. Phone and PC must be on the same Wi‑Fi; allow inbound TCP 3000 in Windows Firewall if using a physical device

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
