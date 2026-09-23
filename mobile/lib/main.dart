import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'services/api_service.dart';
import 'theme.dart';

void main() {
  runApp(const AiAutonomousCompanyApp());
}

class AiAutonomousCompanyApp extends StatelessWidget {
  const AiAutonomousCompanyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(ApiService()),
      child: MaterialApp(
        title: 'AI Autonomous Company',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const _RootRouter(),
      ),
    );
  }
}

/// Shows a splash while the token is being restored from disk, then routes
/// to either the login screen or the main app shell.
class _RootRouter extends StatelessWidget {
  const _RootRouter();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return auth.isAuthenticated ? const HomeShell() : const LoginScreen();
  }
}
