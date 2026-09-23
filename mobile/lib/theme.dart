import 'package:flutter/material.dart';

/// Same palette as the web frontend, so the product feels like one company:
/// deep slate ink, warm amber accent, flat hairline-bordered surfaces
/// instead of heavy drop shadows.
class AppColors {
  static const ink = Color(0xFF1B2430);
  static const inkSoft = Color(0xFF4A5568);
  static const bg = Color(0xFFEDEFF3);
  static const surface = Color(0xFFFFFFFF);
  static const sidebar = Color(0xFF171C26);
  static const accent = Color(0xFFC77D2E);
  static const accentSoft = Color(0xFFF1DFC8);
  static const line = Color(0xFFD8DCE3);
  static const success = Color(0xFF3F7D58);
  static const successBg = Color(0xFFE5F1E9);
  static const danger = Color(0xFFB0413E);
  static const dangerBg = Color(0xFFF7E6E5);
  static const pending = Color(0xFF6B7280);
  static const pendingBg = Color(0xFFE9EAEC);
}

ThemeData buildAppTheme() {
  final base = ThemeData(useMaterial3: true, brightness: Brightness.light);
  return base.copyWith(
    scaffoldBackgroundColor: AppColors.bg,
    colorScheme: base.colorScheme.copyWith(
      primary: AppColors.ink,
      secondary: AppColors.accent,
      surface: AppColors.surface,
      error: AppColors.danger,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.sidebar,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardTheme(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: AppColors.line),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: const Color(0xFF1A1300),
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.sidebar,
      selectedItemColor: AppColors.accent,
      unselectedItemColor: Color(0xFFB9C2D0),
      type: BottomNavigationBarType.fixed,
    ),
    textTheme: base.textTheme.apply(bodyColor: AppColors.ink, displayColor: AppColors.ink),
  );
}
