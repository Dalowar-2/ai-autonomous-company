import 'dart:convert';
import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/models.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

/// Thin wrapper around the backend REST API. Holds the current auth token
/// in memory; [AuthProvider] is responsible for persisting/restoring it.
class ApiService {
  String? _token;

  void setToken(String? token) {
    _token = token;
  }

  Map<String, String> _headers({bool auth = true}) {
    final headers = {'Content-Type': 'application/json'};
    if (auth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('${AppConfig.apiBaseUrl}$path').replace(queryParameters: query);

  dynamic _decode(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return null;
      return jsonDecode(res.body);
    }
    String detail = res.reasonPhrase ?? 'Request failed (${res.statusCode})';
    try {
      final parsed = jsonDecode(res.body);
      if (parsed is Map && parsed['detail'] != null) {
        detail = parsed['detail'] is String ? parsed['detail'] : jsonEncode(parsed['detail']);
      }
    } catch (_) {
      // keep default detail
    }
    throw ApiException(detail);
  }

  // ---------------- Auth ----------------

  Future<String> login(String email, String password) async {
    final res = await http.post(
      _uri('/auth/login'),
      headers: _headers(auth: false),
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = _decode(res);
    return data['access_token'] as String;
  }

  Future<AppUser> me() async {
    final res = await http.get(_uri('/auth/me'), headers: _headers());
    return AppUser.fromJson(_decode(res) as Map<String, dynamic>);
  }

  // ---------------- Projects ----------------

  Future<List<Project>> listProjects() async {
    final res = await http.get(_uri('/projects/'), headers: _headers());
    final data = _decode(res) as List;
    return data.map((e) => Project.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Project> createProject(String name, String description) async {
    final res = await http.post(
      _uri('/projects/'),
      headers: _headers(),
      body: jsonEncode({'name': name, 'description': description}),
    );
    return Project.fromJson(_decode(res) as Map<String, dynamic>);
  }

  // ---------------- Tasks ----------------

  Future<List<Task>> listTasks() async {
    final res = await http.get(_uri('/tasks/'), headers: _headers());
    final data = _decode(res) as List;
    return data.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Task> createTask(String title, String instruction, int projectId) async {
    final res = await http.post(
      _uri('/tasks/'),
      headers: _headers(),
      body: jsonEncode({'title': title, 'instruction': instruction, 'project_id': projectId}),
    );
    return Task.fromJson(_decode(res) as Map<String, dynamic>);
  }

  Future<AgentExecution> executeTask(int taskId, {String mode = 'multi'}) async {
    final res = await http.post(_uri('/tasks/$taskId/execute', {'mode': mode}), headers: _headers());
    return AgentExecution.fromJson(_decode(res) as Map<String, dynamic>);
  }

  Future<List<AgentExecution>> getExecutions(int taskId) async {
    final res = await http.get(_uri('/tasks/$taskId/executions'), headers: _headers());
    final data = _decode(res) as List;
    return data.map((e) => AgentExecution.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Artifact>> getArtifacts(int executionId) async {
    final res = await http.get(_uri('/tasks/executions/$executionId/artifacts'), headers: _headers());
    final data = _decode(res) as List;
    return data.map((e) => Artifact.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ---------------- Agents ----------------

  Future<List<AgentRole>> listAgents() async {
    final res = await http.get(_uri('/agents/'), headers: _headers());
    final data = _decode(res) as List;
    return data.map((e) => AgentRole.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ---------------- Knowledge base ----------------

  Future<List<KnowledgeDoc>> listKnowledge() async {
    final res = await http.get(_uri('/knowledge/'), headers: _headers());
    final data = _decode(res) as List;
    return data.map((e) => KnowledgeDoc.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<KnowledgeDoc> createKnowledge(String title, String content, String category) async {
    final res = await http.post(
      _uri('/knowledge/'),
      headers: _headers(),
      body: jsonEncode({'title': title, 'content': content, 'category': category}),
    );
    return KnowledgeDoc.fromJson(_decode(res) as Map<String, dynamic>);
  }

  Future<void> deleteKnowledge(int id) async {
    final res = await http.delete(_uri('/knowledge/$id'), headers: _headers());
    _decode(res);
  }
}
