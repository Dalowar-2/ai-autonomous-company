
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const STATUS_ICONS = {
  planning: "📝",
  running: "⚡",
  completed: "✅",
  failed: "❌",
  needs_approval: "👀",
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setError("");
      setLoading(true);

      const data = await api.listProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setError("");
    setCreating(true);

    try {
      await api.createProject(
        name.trim(),
        description.trim()
      );

      setName("");
      setDescription("");

      await load();
    } catch (err) {
      setError(err.message || "Unable to create project.");
    } finally {
      setCreating(false);
    }
  }

  const summary = useMemo(() => {
    return {
      total: projects.length,
      planning: projects.filter(
        (p) => p.status === "planning"
      ).length,
      running: projects.filter(
        (p) => p.status === "running"
      ).length,
      completed: projects.filter(
        (p) => p.status === "completed"
      ).length,
    };
  }, [projects]);

  return (
    <div className="main">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>
            Organize autonomous tasks into focused company
            projects.
          </p>
        </div>

        <button
          className="btn btn-ghost"
          onClick={load}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Project statistics */}
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">TOTAL PROJECTS</div>
          <div className="stat-value">
            {summary.total}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">PLANNING</div>
          <div className="stat-value">
            {summary.planning}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">RUNNING</div>
          <div className="stat-value">
            {summary.running}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">COMPLETED</div>
          <div className="stat-value">
            {summary.completed}
          </div>
        </div>
      </div>

      {/* Create project */}
      <div className="panel">
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>
            🚀 Create New Project
          </h2>

          <p className="list-sub">
            Create a project and assign autonomous tasks to it.
          </p>
        </div>

        <form onSubmit={handleCreate}>
          <div className="field">
            <label>Project name</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Company Launch"
              required
              disabled={creating}
            />
          </div>

          <div className="field">
            <label>Description</label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Describe the goal of this project..."
              rows={4}
              disabled={creating}
            />
          </div>

          <button
            className="btn btn-accent"
            disabled={creating}
          >
            {creating
              ? "Creating project..."
              : "+ Create project"}
          </button>

          {error && (
            <p className="error-text">
              {error}
            </p>
          )}
        </form>
      </div>

      {/* Projects list */}
      <div className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              All Projects
            </h2>

            <p className="list-sub">
              {projects.length} project
              {projects.length === 1 ? "" : "s"} available
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div
              style={{
                fontSize: 32,
                marginBottom: 8,
              }}
            >
              📁
            </div>

            <strong>No projects yet</strong>

            <p className="list-sub">
              Create your first project using the form above.
            </p>
          </div>
        ) : (
          projects.map((project) => {
            const status =
              project.status || "planning";

            return (
              <div
                className="list-row"
                key={project.id}
                style={{
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: 26,
                      flexShrink: 0,
                    }}
                  >
                    📁
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div className="list-title">
                      {project.name}
                    </div>

                    <div
                      className="list-sub"
                      style={{
                        marginTop: 5,
                      }}
                    >
                      {project.description ||
                        "No description provided."}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        opacity: 0.6,
                      }}
                    >
                      PROJECT #{project.id}
                    </div>
                  </div>
                </div>

                <span
                  className={`badge badge-${status}`}
                  style={{
                    whiteSpace: "nowrap",
                  }}
                >
                  {STATUS_ICONS[status] || "•"}{" "}
                  {status.replace("_", " ")}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

