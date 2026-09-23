import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService api;
  AppUser? user;
  bool loading = true;
  String? error;

  AuthProvider(this.api) {
    _restoreSession();
  }

  bool get isAuthenticated => user != null;

  Future<void> _restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      loading = false;
      notifyListeners();
      return;
    }
    api.setToken(token);
    try {
      user = await api.me();
    } catch (_) {
      await prefs.remove('token');
      api.setToken(null);
    }
    loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    error = null;
    final token = await api.login(email, password);
    api.setToken(token);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    user = await api.me();
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    api.setToken(null);
    user = null;
    notifyListeners();
  }
}
