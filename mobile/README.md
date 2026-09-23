# AI Autonomous Company — Mobile (Flutter/Android)

A Flutter client mirroring the web dashboard: Login, Dashboard, Projects,
Tasks (create + execute the multi-agent chain + inspect every artifact),
Agents, and Knowledge base — talking to the same FastAPI backend.

> **Note on how this was built:** this sandbox doesn't have the Flutter SDK
> or access to pub.dev, so unlike the backend/frontend I could not run
> `flutter pub get` / `flutter build` / `flutter analyze` to compile-check
> this code. It's written carefully against standard, stable Flutter/Dart
> APIs, but please run `flutter analyze` yourself after setup (step 3
> below) and let me know if anything needs fixing.

## 1. Generate the platform folders

This repo only ships the Dart source (`lib/`) and `pubspec.yaml` —
the `android/`, `ios/` etc. folders are Gradle/Xcode boilerplate that's
version-specific and best generated fresh by the Flutter tool itself:

```bash
cd mobile
flutter create --org com.yourcompany --project-name ai_autonomous_company .
```

This will scaffold `android/`, `ios/`, etc. **without** overwriting the
`lib/` and `pubspec.yaml` you already have (it only fills in missing files).

## 2. Install dependencies

```bash
flutter pub get
```

## 3. Sanity-check the code (do this — I couldn't)

```bash
flutter analyze
```

Fix anything it flags — most likely a minor API rename between Flutter
versions (e.g. a theme class or a parameter name).

## 4. Allow cleartext HTTP for local development (Android-specific)

Android blocks plain `http://` network calls by default from API level 28+.
Since the local backend runs on plain HTTP, add this for development:

Edit `android/app/src/main/AndroidManifest.xml` and add
`android:usesCleartextTraffic="true"` to the `<application>` tag:

```xml
<application
    android:label="ai_autonomous_company"
    android:usesCleartextTraffic="true"
    ...>
```

(For a real release build talking to a production backend, use HTTPS
instead and remove this flag.)

## 5. Point the app at your backend

- **Android emulator**: the backend must be reachable at `http://10.0.2.2:8000`
  (this is the emulator's special alias for your computer's `localhost` —
  see the comment in `lib/config.dart`). This is the default, no changes needed
  if your FastAPI backend runs on `127.0.0.1:8000`.
- **Physical Android device** on the same Wi-Fi as your computer:
  ```bash
  flutter run --dart-define=API_BASE_URL=http://<your-computer-lan-ip>:8000
  ```

## 6. Run it

Start the backend first (see the root `README.md`), then:

```bash
flutter run
```

Sign in with the seeded admin account: `admin@example.com` / `Admin123!`.

## What's here

```
mobile/
├── pubspec.yaml
└── lib/
    ├── main.dart              # entry point, routes to Login or HomeShell
    ├── config.dart            # API base URL (dart-define overridable)
    ├── theme.dart             # same color system as the web dashboard
    ├── models/models.dart     # data classes mirroring the backend schemas
    ├── services/api_service.dart   # HTTP client for every backend endpoint
    ├── providers/auth_provider.dart # login state + token persistence
    ├── widgets/status_badge.dart
    └── screens/
        ├── login_screen.dart
        ├── home_shell.dart    # bottom nav shell
        ├── dashboard_screen.dart
        ├── projects_screen.dart
        ├── tasks_screen.dart
        ├── task_detail_screen.dart   # execute + inspect the agent chain
        ├── agents_screen.dart
        └── knowledge_screen.dart
```

## Known gaps (same spirit as the web frontend)

- No registration screen (backend `/auth/register` exists, just not wired up here)
- No offline support / caching — every screen fetches fresh from the API
- No push notifications for long-running task completion
