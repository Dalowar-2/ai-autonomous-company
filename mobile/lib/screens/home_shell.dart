import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import 'agents_screen.dart';
import 'dashboard_screen.dart';
import 'knowledge_screen.dart';
import 'projects_screen.dart';
import 'tasks_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _titles = ['Dashboard', 'Projects', 'Tasks', 'Agents', 'Knowledge base'];

  final _screens = const [
    DashboardScreen(),
    ProjectsScreen(),
    TasksScreen(),
    AgentsScreen(),
    KnowledgeScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () => context.read<AuthProvider>().logout(),
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.folder_outlined), label: 'Projects'),
          BottomNavigationBarItem(icon: Icon(Icons.task_alt_outlined), label: 'Tasks'),
          BottomNavigationBarItem(icon: Icon(Icons.smart_toy_outlined), label: 'Agents'),
          BottomNavigationBarItem(icon: Icon(Icons.menu_book_outlined), label: 'Knowledge'),
        ],
      ),
    );
  }
}
