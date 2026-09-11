# Mobile (Expo SDK 57) — offline on-device

Native iOS/Android client for 1day. Data lives in **SQLite on the device** — no backend, no Wi‑Fi, no PC required at runtime.

## Dev (Expo)

```bash
pnpm --filter mobile start
```

Register once on the device; auth, goals, habits, journal, check-ins, routines, and biography all persist locally.

AI chat history is local; live LLM coaching is stubbed offline.

## Production builds (Windows OK)

App IDs: `com.oneday.app` (Android + iOS).

Install EAS CLI and log in:

```bash
npm i -g eas-cli
cd apps/mobile
eas login
eas build:configure
```

### Android APK (install directly on phone)

```bash
eas build --platform android --profile preview
```

Download the APK from the Expo dashboard and install it (allow unknown sources if needed).

Local release alternative (needs Android Studio / SDK):

```bash
npx expo prebuild --platform android
npx expo run:android --variant release
```

### iOS (no Mac required)

Needs an **Apple Developer Program** account (~$99/year). EAS builds in the cloud:

```bash
eas build --platform ios --profile preview
```

Install via TestFlight or the Expo install link after credentials are set up (`eas credentials`).

### Both platforms

```bash
eas build --platform all --profile preview
```

## Offline checklist

1. Install the preview/production build (not Expo Go for SQLite-heavy native deps if you use a custom client; Expo Go SDK 57 includes `expo-sqlite`).
2. Enable airplane mode.
3. Register → onboarding → morning check-in → habits → journal → biography.
4. Kill and reopen the app — data should still be there.
