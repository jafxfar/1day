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

## Auth

- Login/register return `{ user, token }`
- Token stored in `expo-secure-store`
- Authenticated requests send `Authorization: Bearer <token>`
- Network errors include the resolved `API_BASE_URL` so you can verify the host
