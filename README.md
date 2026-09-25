# Location Reminder

Reminders that fire when you **arrive at** or **leave** a place, not at a time.

> "I need to do X once I get to Y, but I don't know when that will be."

Built with Expo (React Native). No backend, no accounts, no API keys: reminders live in SQLite on the phone, the OS geofencing API watches the places, and a local notification fires when you cross the boundary.

## How it works

| Piece | What it does |
| --- | --- |
| `expo-location` geofencing | Registers each active reminder as a region with the OS. The OS wakes the app when you enter or leave it, even if the app is closed. |
| `expo-task-manager` (`src/lib/tasks.ts`) | Background task that receives enter/exit events and decides whether to notify. |
| `expo-background-task` | Re-registers geofences about once an hour (Android clears them on reboot; iOS watches only the 20 nearest). |
| `expo-notifications` | Local notification. Tapping it opens the reminder. |
| `expo-sqlite` (`src/lib/db.ts`) | Stores reminders. |
| Leaflet + OpenStreetMap in a WebView (`src/components/place-map.tsx`) | Map for picking the place. Free, no Google Maps key. |
| Nominatim (`src/lib/places.ts`) | Free address search. |

Only real transitions fire a reminder. Each one stores whether you were last inside its region, so re-registering regions while you're already inside doesn't trigger it again. A 10 minute cooldown stops GPS jitter at the edge from firing repeat reminders.

## Running it

Background location **does not work in Expo Go**. You need a development build, which is your own debug version of the app.

### Option A: build in the cloud (no Android SDK needed, works from WSL)

```bash
npm install
npx eas-cli@latest login          # free Expo account
npx eas-cli@latest init           # links the project to your account (adds projectId to app.json)
npm run build:dev                 # ~10-15 min on the free tier; gives you a link/QR to the APK
```

Install the APK on your phone. Then run the dev server and open the app, which connects to it:

```bash
npm start                         # use --tunnel if the phone isn't on the same network as WSL
```

JS changes reload instantly. You only need to rebuild after adding or changing native modules or `app.json` plugins.

### Option B: build locally

Install Android Studio and the SDK, connect the phone with USB debugging, then run `npm run android`.

### Standalone APK (no dev server)

```bash
npm run build:apk
```

## Testing that it actually works

1. Open the app, tap **Grant access**, and choose **Allow all the time** for location. Android sends you to Settings for this.
2. Create a reminder for a place ~500 m away with a 150 m radius.
3. Lock the phone and walk there. Expect the notification within a minute or two of crossing the boundary.
4. Some Android brands (Xiaomi, Huawei, OnePlus, Samsung) kill background apps. If reminders don't fire, set battery usage for the app to **Unrestricted**. See [dontkillmyapp.com](https://dontkillmyapp.com).

## Limits

- Accuracy is ~100 m, so use a radius of 150 m or more.
- Triggers can be 1–3 minutes late. The OS batches location work to save battery.
- iOS monitors at most 20 regions per app (the nearest 20 are kept), Android 100.
- If you force-stop the app on Android, geofences stop until you open it again.

## Scripts

| Command | |
| --- | --- |
| `npm start` | Dev server for the development build |
| `npm run android` | Local native build and run (needs Android SDK) |
| `npm run build:dev` | Cloud development build (APK) |
| `npm run build:apk` | Cloud standalone APK |
| `npm run lint` / `npm run typecheck` | Checks |
