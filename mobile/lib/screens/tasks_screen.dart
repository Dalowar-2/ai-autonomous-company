import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';
import '../widgets/status_badge.dart';
import 'task_detail_screen.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  List<Task> _tasks = [];
  List<Project> _projects = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<AuthProvider>().api;
      final results = await Future.wait([api.listTasks(), api.listProjects()]);
      setState(() {
        _tasks = results[0] as List<Task>;
        _projects = results[1] as List<Project>;
        _error = null;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _openCreateDialog() async {
    if (_projects.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Create a project first, from the Projects tab.')),
      );
      return;
    }
    final titleController = TextEditingController();
    final instructionController = TextEditingController();
    int selectedProjectId = _projects.first.id;

    final created = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          title: const Text('New task'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  value: selectedProjectId,
                  decoration: const InputDecoration(labelText: 'Project'),
                  items: _projects
                      .map((p) => DropdownMenuItem(value: p.id, child: Text(p.name)))
                      .toList(),
                  onChanged: (value) => setDialogState(() => selectedProjectId = value!),
                ),
                const SizedBox(height: 12),
                TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Title')),
                const SizedBox(height: 12),
                TextField(
                  controller: instructionController,
                  decoration: const InputDecoration(
                    labelText: 'Instruction',
                    hintText: 'e.g. Write a one-page proposal for...',
                  ),
                  maxLines: 4,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                if (titleController.text.trim().isEmpty || instructionController.text.trim().isEmpty) return;
                try {
                  await context.read<AuthProvider>().api.createTask(
                        titleController.text.trim(),
                        instructionController.text.trim(),
                        selectedProjectId,
                      );
                  if (dialogContext.mounted) Navigator.pop(dialogContext, true);
                } catch (e) {
                  if (dialogContext.mounted) {
                    ScaffoldMessenger.of(dialogContext).showSnackBar(SnackBar(content: Text(e.toString())));
                  }
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
    if (created == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(children: [Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
                  )])
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _tasks.isEmpty ? 1 : _tasks.length,
                    itemBuilder: (context, index) {
                      if (_tasks.isEmpty) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 40),
                          child: Center(child: Text('No tasks yet. Tap + to create one.')),
                        );
                      }
                      final t = _tasks[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(t.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text(
                            t.instruction.length > 90 ? '${t.instruction.substring(0, 90)}...' : t.instruction,
                          ),
                          trailing: StatusBadge(status: t.status),
                          onTap: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => TaskDetailScreen(task: t)),
                            );
                            _load();
                          },
                        ),
                      );
                    },
                  ),
      ),
      floatingActionButton: FloatingActionButton(onPressed: _openCreateDialog, child: const Icon(Icons.add)),
    );
  }
}
