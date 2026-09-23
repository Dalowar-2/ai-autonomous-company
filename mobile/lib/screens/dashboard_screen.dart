import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';
import '../widgets/status_badge.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<_DashboardData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_DashboardData> _load() async {
    final api = context.read<AuthProvider>().api;
    final results = await Future.wait([api.listProjects(), api.listTasks(), api.listAgents()]);
    return _DashboardData(
      projects: results[0] as List<Project>,
      tasks: results[1] as List<Task>,
      agents: results[2] as List<AgentRole>,
    );
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<_DashboardData>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return ListView(children: [Padding(
              padding: const EdgeInsets.all(24),
              child: Text('${snapshot.error}', style: const TextStyle(color: AppColors.danger)),
            )]);
          }
          final data = snapshot.data!;
          final completed = data.tasks.where((t) => t.status == 'completed').length;
          final running = data.tasks.where((t) => t.status == 'planning' || t.status == 'running').length;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.8,
                children: [
                  _StatCard(label: 'Projects', value: data.projects.length.toString()),
                  _StatCard(label: 'Tasks', value: data.tasks.length.toString()),
                  _StatCard(label: 'Completed', value: completed.toString()),
                  _StatCard(label: 'In progress', value: running.toString()),
                ],
              ),
              const SizedBox(height: 16),
              const Text('Recent tasks', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              if (data.tasks.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: Text('No tasks yet.', style: TextStyle(color: AppColors.inkSoft))),
                ),
              ...data.tasks.take(5).map(
                    (t) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(t.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(
                          t.instruction.length > 80 ? '${t.instruction.substring(0, 80)}...' : t.instruction,
                        ),
                        trailing: StatusBadge(status: t.status),
                      ),
                    ),
                  ),
            ],
          );
        },
      ),
    );
  }
}

class _DashboardData {
  final List<Project> projects;
  final List<Task> tasks;
  final List<AgentRole> agents;
  _DashboardData({required this.projects, required this.tasks, required this.agents});
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: const TextStyle(fontSize: 12.5, color: AppColors.inkSoft)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
