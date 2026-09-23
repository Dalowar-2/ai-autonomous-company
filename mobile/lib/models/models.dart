class AppUser {
  final int id;
  final String email;
  final String fullName;
  final String role;

  AppUser({required this.id, required this.email, required this.fullName, required this.role});

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as int,
        email: json['email'] as String,
        fullName: json['full_name'] as String,
        role: json['role'] as String,
      );
}

class Project {
  final int id;
  final String name;
  final String description;
  final String status;

  Project({required this.id, required this.name, required this.description, required this.status});

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        id: json['id'] as int,
        name: json['name'] as String,
        description: (json['description'] as String?) ?? '',
        status: json['status'] as String,
      );
}

class Task {
  final int id;
  final String title;
  final String instruction;
  final String status;
  final int projectId;

  Task({
    required this.id,
    required this.title,
    required this.instruction,
    required this.status,
    required this.projectId,
  });

  factory Task.fromJson(Map<String, dynamic> json) => Task(
        id: json['id'] as int,
        title: json['title'] as String,
        instruction: json['instruction'] as String,
        status: json['status'] as String,
        projectId: json['project_id'] as int,
      );
}

class AgentRole {
  final int id;
  final String name;
  final String displayName;
  final String description;
  final bool isActive;

  AgentRole({
    required this.id,
    required this.name,
    required this.displayName,
    required this.description,
    required this.isActive,
  });

  factory AgentRole.fromJson(Map<String, dynamic> json) => AgentRole(
        id: json['id'] as int,
        name: json['name'] as String,
        displayName: json['display_name'] as String,
        description: (json['description'] as String?) ?? '',
        isActive: json['is_active'] as bool? ?? true,
      );
}

class AgentExecution {
  final int id;
  final int taskId;
  final int agentId;
  final String? agentName;
  final String inputText;
  final String outputText;
  final String status;
  final String errorMessage;

  AgentExecution({
    required this.id,
    required this.taskId,
    required this.agentId,
    required this.agentName,
    required this.inputText,
    required this.outputText,
    required this.status,
    required this.errorMessage,
  });

  factory AgentExecution.fromJson(Map<String, dynamic> json) => AgentExecution(
        id: json['id'] as int,
        taskId: json['task_id'] as int,
        agentId: json['agent_id'] as int,
        agentName: json['agent_name'] as String?,
        inputText: (json['input_text'] as String?) ?? '',
        outputText: (json['output_text'] as String?) ?? '',
        status: json['status'] as String,
        errorMessage: (json['error_message'] as String?) ?? '',
      );
}

class Artifact {
  final int id;
  final String name;
  final String contentType;
  final String content;

  Artifact({required this.id, required this.name, required this.contentType, required this.content});

  factory Artifact.fromJson(Map<String, dynamic> json) => Artifact(
        id: json['id'] as int,
        name: json['name'] as String,
        contentType: (json['content_type'] as String?) ?? 'text/plain',
        content: (json['content'] as String?) ?? '',
      );
}

class KnowledgeDoc {
  final int id;
  final String title;
  final String content;
  final String category;

  KnowledgeDoc({required this.id, required this.title, required this.content, required this.category});

  factory KnowledgeDoc.fromJson(Map<String, dynamic> json) => KnowledgeDoc(
        id: json['id'] as int,
        title: json['title'] as String,
        content: json['content'] as String,
        category: (json['category'] as String?) ?? 'general',
      );
}
