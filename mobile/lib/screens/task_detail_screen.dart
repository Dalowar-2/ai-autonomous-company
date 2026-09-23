import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';
import '../widgets/status_badge.dart';

class TaskDetailScreen extends StatefulWidget {
  final Task task;
  const TaskDetailScreen({super.key, required this.task});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  List<AgentExecution> _executions = [];
  bool _loadingExecutions = false;
  bool _running = false;
  String? _error;
  late String _status;

  @override
  void initState() {
    super.initState();
    _status = widget.task.status;
    _loadExecutions();
  }

  Future<void> _loadExecutions() async {
    setState(() => _loadingExecutions = true);
    try {
      final api = context.read<AuthProvider>().api;
      final executions = await api.getExecutions(widget.task.id);
      setState(() => _executions = executions);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loadingExecutions = false);
    }
  }

  Future<void> _execute() async {
    setState(() {
      _running = true;
      _error = null;
    });
    try {
      final api = context.read<AuthProvider>().api;
      await api.executeTask(widget.task.id);
      await _loadExecutions();
      final updatedTasks = await api.listTasks();
      final updated = updatedTasks.where((t) => t.id == widget.task.id).toList();
      if (updated.isNotEmpty) setState(() => _status = updated.first.status);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _running = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.task.title)),
      body: RefreshIndicator(
        onRefresh: _loadExecutions,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Status', style: TextStyle(color: AppColors.inkSoft, fontSize: 13)),
                        StatusBadge(status: _status),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(widget.task.instruction),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _running ? null : _execute,
                        icon: _running
                            ? const SizedBox(
                                height: 16,
                                width: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.play_arrow, size: 18),
                        label: Text(_running ? 'Running agent chain...' : 'Execute'),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 8),
                      Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Execution chain', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (_loadingExecutions) const Center(child: CircularProgressIndicator()),
            if (!_loadingExecutions && _executions.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Text('No executions yet — tap Execute to run the agent chain.',
                    style: TextStyle(color: AppColors.inkSoft)),
              ),
            ..._executions.asMap().entries.map((entry) => _ExecutionTile(
                  index: entry.key + 1,
                  execution: entry.value,
                )),
          ],
        ),
      ),
    );
  }
}

class _ExecutionTile extends StatefulWidget {
  final int index;
  final AgentExecution execution;
  const _ExecutionTile({required this.index, required this.execution});

  @override
  State<_ExecutionTile> createState() => _ExecutionTileState();
}

class _ExecutionTileState extends State<_ExecutionTile> {
  List<Artifact>? _artifacts;
  bool _loading = false;

  Future<void> _toggleArtifacts() async {
    if (_artifacts != null) {
      setState(() => _artifacts = null);
      return;
    }
    setState(() => _loading = true);
    try {
      final api = context.read<AuthProvider>().api;
      final artifacts = await api.getArtifacts(widget.execution.id);
      setState(() => _artifacts = artifacts);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ex = widget.execution;
    final badgeStatus = ex.status == 'succeeded' ? 'completed' : ex.status;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 12,
                  backgroundColor: AppColors.ink,
                  child: Text('${widget.index}', style: const TextStyle(color: Colors.white, fontSize: 11)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(ex.agentName ?? 'Agent #${ex.agentId}',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
                StatusBadge(status: badgeStatus),
              ],
            ),
            if (ex.errorMessage.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(ex.errorMessage, style: const TextStyle(color: AppColors.danger, fontSize: 12.5)),
            ],
            const SizedBox(height: 8),
            TextButton(
              onPressed: _loading ? null : _toggleArtifacts,
              style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
              child: Text(
                _loading ? 'Loading...' : (_artifacts != null ? 'Hide artifacts' : 'View artifacts'),
                style: const TextStyle(fontSize: 12.5),
              ),
            ),
            if (_artifacts != null)
              ..._artifacts!.map((a) => Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(a.name, style: const TextStyle(fontSize: 12.5, color: AppColors.inkSoft)),
                        const SizedBox(height: 4),
                        Container(
                          width: double.infinity,
                          constraints: const BoxConstraints(maxHeight: 220),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAFAF9),
                            border: Border.all(color: AppColors.line),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: SingleChildScrollView(
                            child: Text(a.content, style: const TextStyle(fontSize: 12.5)),
                          ),
                        ),
                      ],
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}
