
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const WORKFLOW = [
  {
    icon: "🧠",
    name: "Planner",
    description: "Breaks the instruction into subtasks",
  },
  {
    icon: "🔎",
    name: "Researcher",
    description: "Researches relevant information",
  },
  {
    icon: "📊",
    name: "Analyst",
    description: "Analyzes data and strategy",
  },
  {
    icon: "✍️",
    name: "Writer",
    description: "Creates professional content",
  },
  {
    icon: "👨‍💼",
    name: "Supervisor",
    description: "Combines specialist outputs",
  },
  {
    icon: "🧪",
    name: "QA",
    description: "Reviews quality and accuracy",
  },
  {
    icon: "🔍",
    name: "Auditor",
    description: "Performs the final verification",
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setError("");

      const [projects, tasks, agents] = await Promise.all([
        api.listProjects(),
        api.listTasks(),
        api.listAgents(),
      ]);

      const completed = tasks.filter(
        (t) => t.status === "completed"
      ).length;

      const running = tasks.filter((t) =>
        ["planning", "running"].includes(t.status)
      ).length;

      const failed = tasks.filter(
        (t) => ["failed", "needs_approval"].includes(t.status)
      ).length;

      setStats({
        projects,
        tasks,
        agents,
        completed,
        running,
        failed,
      });
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    }
  }

  const completionRate = useMemo(() => {
    if (!stats || stats.tasks.length === 0) return 0;
    return Math.round(
      (stats.completed / stats.tasks.length) * 100
    );
  }, [stats]);

  if (error) {
    return (
      <div className="main">
        <div className="panel">
          <p className="error-text">{error}</p>
          <button
            className="btn btn-accent"
            onClick={loadDashboard}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="main">
        <div className="panel">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>AI Autonomous Company</h1>
          <p>
            Autonomous agents plan, execute, review, and deliver
            business tasks.
          </p>
        </div>

        <button
          className="btn btn-ghost"
          onClick={loadDashboard}
        >
          ↻ Refresh
        </button>
      </div>

      {/* System status */}
      <div className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="stat-label">SYSTEM STATUS</div>
            <h2 style={{ margin: "6px 0 4px" }}>
              🟢 Autonomous system online
            </h2>
            <p className="list-sub">
              Local AI workflow is ready to process tasks.
            </p>
          </div>

          <div>
            <div className="stat-label">COMPLETION RATE</div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              {completionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">Projects</div>
          <div className="stat-value">
            {stats.projects.length}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">
            {stats.tasks.length}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">Completed</div>
          <div className="stat-value">
            {stats.completed}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">
            {stats.running}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">Agent Roles</div>
          <div className="stat-value">
            {stats.agents.length}
          </div>
        </div>
      </div>

      {/* Autonomous workflow */}
      <div className="panel">
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>
              🤖 Autonomous Agent Workflow
            </h2>
            <p className="list-sub">
              Each task moves through a structured multi-agent
              pipeline.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {WORKFLOW.map((agent, index) => (
            <div
              key={agent.name}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: 14,
                position: "relative",
              }}
            >
              <div style={{ fontSize: 25 }}>
                {agent.icon}
              </div>

              <div
                style={{
                  fontWeight: 700,
                  marginTop: 8,
                }}
              >
                {agent.name}
              </div>

              <div
                className="list-sub"
                style={{
                  marginTop: 5,
                  lineHeight: 1.4,
                }}
              >
                {agent.description}
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  opacity: 0.6,
                }}
              >
                STEP {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent tasks */}
      <div className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>
            Recent Tasks
          </h3>

          <span className="list-sub">
            {stats.tasks.length} total
          </span>
        </div>

        {stats.tasks.length === 0 ? (
          <div className="empty-state">
            No tasks yet. Create one from the Tasks page.
          </div>
        ) : (
          stats.tasks.slice(0, 7).map((task) => (
            <div
              className="list-row"
              key={task.id}
            >
              <div style={{ minWidth: 0 }}>
                <div className="list-title">
                  {task.title}
                </div>

                <div className="list-sub">
                  {task.instruction.slice(0, 100)}
                  {task.instruction.length > 100
                    ? "..."
                    : ""}
                </div>
              </div>

              <span
                className={`badge badge-${task.status}`}
              >
                {task.status.replace("_", " ")}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Bottom overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <div className="panel">
          <div className="stat-label">
            COMPLETED TASKS
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {stats.completed}
          </div>

          <p className="list-sub">
            Successfully completed autonomous tasks.
          </p>
        </div>

        <div className="panel">
          <div className="stat-label">
            ACTIVE TASKS
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {stats.running}
          </div>

          <p className="list-sub">
            Tasks currently being processed.
          </p>
        </div>

        <div className="panel">
          <div className="stat-label">
            NEEDS REVIEW
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {stats.failed}
          </div>

          <p className="list-sub">
            Failed or approval-required tasks.
          </p>
        </div>
      </div>
    </div>
  );
}

