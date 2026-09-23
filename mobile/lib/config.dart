/// Central place to configure the backend URL.
///
/// IMPORTANT (Android specific): the Android emulator cannot reach your
/// computer's "localhost" directly — `10.0.2.2` is the special alias the
/// emulator uses to mean "the host machine's localhost". So if your FastAPI
/// backend is running on your laptop at http://127.0.0.1:8000, the emulator
/// must use http://10.0.2.2:8000, NOT http://127.0.0.1:8000 or http://localhost:8000.
///
/// - Android emulator  -> http://10.0.2.2:8000
/// - Physical Android device on same Wi-Fi -> http://<your-computer-lan-ip>:8000
/// - iOS simulator     -> http://127.0.0.1:8000 (works directly, no alias needed)
///
/// Override at build/run time without editing this file:
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.50:8000
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );
}
