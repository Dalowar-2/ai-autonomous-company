
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const AGENT_INFO = {
  planner: {
    icon: "🧠",
    color: "Planner",
    role: "Task Planning",
    description:
      "Breaks complex business instructions into clear, actionable subtasks.",
  },
  researcher: {
    icon: "🔎",
    color: "Researcher",
    role: "Research",
    description:
      "Researches customers, markets, competitors, and relevant information.",
  },
  analyst: {
    icon: "📊",
    color: "Analyst",
    role: "Analysis",
    description:
      "Analyzes information and turns it into useful business insights.",
  },
  developer: {
    icon: "💻",
    color: "Developer",
    role: "Development",
    description:
      "Handles technical implementation, software, APIs, and automation.",
  },
  designer: {
    icon: "🎨",
    color: "Designer",
    role: "Design",
    description:
      "Creates user experience, interface, branding, and design concepts.",
  },
  writer: {
    icon: "✍️",
    color: "Writer",
    role: "Content",
    description:
      "Creates professional documents, proposals, strategies, and content.",
  },
  supervisor: {
    icon: "👨‍💼",
    color: "Supervisor",
    role: "Orchestration",
    description:
      "Combines specialist outputs into one coherent final result.",
  },
  qa: {
    icon: "🧪",
    color: "QA",
    role: "Quality Assurance",
    description:
      "Reviews the generated result for quality, completeness, and consistency.",
  },
  auditor: {
    icon: "🔍",
    color: "Auditor",
    role: "Final Verification",
    description:
      "Performs the final verification and determines whether the result passes.",
  },
};

function getAgentInfo(agent) {
  const name = (
    agent.name ||
    agent.role ||
    agent.display_name ||
    ""
  ).toLowerCase();

  for (const key of Object.keys(AGENT_INFO)) {
    if (name.includes(key)) {
      return AGENT_INFO[key];
    }
  }

  return {
    icon: "🤖",
    color: agent.display_name || "AI Agent",
    role: "Autonomous Agent",
    description:
      agent.description || "Autonomous AI agent in the execution system.",
  };
}

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAgents() {
    try {
      setError("");
      setLoading(true);

      const data = await api.listAgents();
      setAgents(data);
    } catch (err) {
      setError(err.message || "Unable to load agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  const activeCount = useMemo(
    () => agents.filter((a) => a.is_active).length,
    [agents]
  );

  const inactiveCount = agents.length - activeCount;

  return (
    <div className="main">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>AI Agents</h1>
          <p>
            Autonomous roles available to the company execution
            chain.
          </p>
        </div>

        <button
          className="btn btn-ghost"
          onClick={loadAgents}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">TOTAL AGENTS</div>
          <div className="stat-value">
            {agents.length}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">ACTIVE</div>
          <div className="stat-value">
            {activeCount}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">INACTIVE</div>
          <div className="stat-value">
            {inactiveCount}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">WORKFLOW</div>
          <div className="stat-value">
            9
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div className="panel">
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>
            🤖 Autonomous Execution Chain
          </h2>

          <p className="list-sub">
            Agents collaborate to transform an instruction into
            a verified final result.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {[
            "🧠 Planner",
            "🔎 Researcher",
            "📊 Analyst",
            "✍️ Writer",
            "👨‍💼 Supervisor",
            "🧪 QA",
            "🔍 Auditor",
          ].map((step, index) => (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "8px 11px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {step}
              </div>

              {index < 6 && (
                <span style={{ opacity: 0.5 }}>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="panel">
          <p className="error-text">{error}</p>

          <button
            className="btn btn-accent"
            onClick={loadAgents}
          >
            Try again
          </button>
        </div>
      )}

      {/* Agent cards */}
      <div className="panel">
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>
            Agent Directory
          </h2>

          <p className="list-sub">
            Each agent has a specialized responsibility inside
            the autonomous company.
          </p>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading agents...
          </div>
        ) : agents.length === 0 ? (
          <div className="empty-state">
            No agents available.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 14,
            }}
          >
            {agents.map((agent) => {
              const info = getAgentInfo(agent);

              return (
                <div
                  key={agent.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: 18,
                    minHeight: 190,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 32,
                        }}
                      >
                        {info.icon}
                      </div>

                      <span
                        className={`badge ${
                          agent.is_active
                            ? "badge-completed"
                            : "badge-failed"
                        }`}
                      >
                        {agent.is_active
                          ? "active"
                          : "inactive"}
                      </span>
                    </div>

                    <h3
                      style={{
                        margin: "12px 0 4px",
                      }}
                    >
                      {agent.display_name}
                    </h3>

                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.65,
                        marginBottom: 10,
                      }}
                    >
                      {info.role}
                    </div>

                    <p
                      className="list-sub"
                      style={{
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {agent.description ||
                        info.description}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 10,
                      borderTop: "1px solid var(--line)",
                      fontSize: 11,
                      opacity: 0.55,
                    }}
                  >
                    AGENT #{agent.id}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

