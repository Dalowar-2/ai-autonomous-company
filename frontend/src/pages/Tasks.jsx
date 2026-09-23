
import { useEffect, useState } from "react";
import { api } from "../services/api";
import StatusBadge from "../components/StatusBadge";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  function loadTasks() {
    api.listTasks()
      .then(setTasks)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadTasks();

    api.listProjects()
      .then((ps) => {
        setProjects(ps);

        if (ps.length > 0) {
          setProjectId(String(ps[0].id));
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();

    setError("");
    setCreating(true);

    try {
      await api.createTask(
        title,
        instruction,
        Number(projectId)
      );

      setTitle("");
      setInstruction("");

      loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="main">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Tasks</h1>

          <p>
            Give an instruction. AI agents plan, execute,
            review, and deliver the work.
          </p>
        </div>
      </div>


      {/* CREATE TASK */}
      <div className="panel">

        <h3 style={{ marginTop: 0 }}>
          New task
        </h3>

        <form onSubmit={handleCreate}>

          <div className="field">
            <label>Project</label>

            <select
              value={projectId}
              onChange={(e) =>
                setProjectId(e.target.value)
              }
              required
            >
              {projects.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>


          <div className="field">
            <label>Title</label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Example: AI Marketing Campaign"
              required
            />
          </div>


          <div className="field">
            <label>Instruction</label>

            <textarea
              value={instruction}
              onChange={(e) =>
                setInstruction(e.target.value)
              }
              placeholder="Example: Create a marketing strategy including target customers, services, channels, and a 30-day action plan."
              required
            />
          </div>


          <button
            className="btn btn-accent"
            disabled={
              creating ||
              projects.length === 0
            }
          >
            {creating
              ? "Creating..."
              : "Create task"}
          </button>


          {projects.length === 0 && (
            <p className="list-sub">
              Create a project first.
            </p>
          )}


          {error && (
            <p className="error-text">
              {error}
            </p>
          )}

        </form>
      </div>


      {/* TASK LIST */}
      <div className="panel">

        <h3 style={{ marginTop: 0 }}>
          All tasks
        </h3>


        {tasks.length === 0 && (
          <div className="empty-state">
            No tasks yet.
          </div>
        )}


        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            expanded={expandedId === t.id}
            onToggle={() =>
              setExpandedId(
                expandedId === t.id
                  ? null
                  : t.id
              )
            }
            onExecuted={loadTasks}
          />
        ))}

      </div>
    </div>
  );
}


/* =====================================================
   TASK ROW
===================================================== */

function TaskRow({
  task,
  expanded,
  onToggle,
  onExecuted,
}) {

  const [executions, setExecutions] =
    useState([]);

  const [artifactsByExecId, setArtifactsByExecId] =
    useState({});

  const [running, setRunning] =
    useState(false);

  const [error, setError] =
    useState("");


  useEffect(() => {

    if (expanded) {
      loadExecutions();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);


  async function loadExecutions() {

    try {

      const data =
        await api.getExecutions(task.id);

      setExecutions(data);

    } catch (err) {

      setError(err.message);

    }
  }


  async function toggleArtifacts(execId) {

    try {

      if (artifactsByExecId[execId]) {

        setArtifactsByExecId(
          (prev) => ({
            ...prev,
            [execId]: undefined,
          })
        );

        return;
      }


      const artifacts =
        await api.getArtifacts(execId);


      setArtifactsByExecId(
        (prev) => ({
          ...prev,
          [execId]: artifacts,
        })
      );

    } catch (err) {

      setError(err.message);

    }
  }


  async function handleExecute() {

    setRunning(true);
    setError("");

    try {

      await api.executeTask(task.id);

      onExecuted();

      await loadExecutions();

    } catch (err) {

      setError(err.message);

    } finally {

      setRunning(false);

    }
  }


  return (

    <div
      style={{
        borderBottom:
          "1px solid var(--line)",
        padding: "16px 0",
      }}
    >

      {/* TASK HEADER */}

      <div
        className="list-row"
        style={{
          borderBottom: "none",
          padding: 0,
        }}
      >

        <div
          style={{
            cursor: "pointer",
            flex: 1,
          }}
          onClick={onToggle}
        >

          <div className="list-title">
            {task.title}
          </div>

          <div className="list-sub">
            {task.instruction.slice(0, 120)}

            {task.instruction.length > 120
              ? "..."
              : ""}
          </div>

        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >

          <StatusBadge
            status={task.status}
          />


          <button
            className="btn btn-ghost"
            onClick={handleExecute}
            disabled={running}
          >

            {running
              ? "Running..."
              : "Execute"}

          </button>

        </div>

      </div>


      {/* ERROR */}

      {error && (
        <p className="error-text">
          {error}
        </p>
      )}


      {/* EXECUTION DETAILS */}

      {expanded && (

        <div
          style={{
            marginTop: 18,
          }}
        >

          {/* WORKFLOW HEADER */}

          <div
            style={{
              padding: "14px 16px",
              marginBottom: 14,
              border:
                "1px solid var(--line)",
              borderRadius: 10,
              background:
                "var(--panel)",
            }}
          >

            <strong>
              🤖 Autonomous Agent Workflow
            </strong>

            <div
              className="list-sub"
              style={{
                marginTop: 6,
              }}
            >
              Planner → Specialists →
              Supervisor → QA → Auditor
            </div>

          </div>


          {executions.length === 0 && (

            <p className="list-sub">
              No executions yet — click
              Execute to run the agent chain.
            </p>

          )}


          {/* AGENT TIMELINE */}

          {executions.map((ex, i) => (

            <AgentExecution
              key={ex.id}
              execution={ex}
              number={i + 1}
              artifacts={
                artifactsByExecId[ex.id]
              }
              onArtifacts={() =>
                toggleArtifacts(ex.id)
              }
            />

          ))}

        </div>
      )}

    </div>
  );
}


/* =====================================================
   AGENT EXECUTION CARD
===================================================== */

function AgentExecution({
  execution,
  number,
  artifacts,
  onArtifacts,
}) {

  const agentName =
    execution.agent_name ||
    `Agent #${execution.agent_id}`;


  const agentInfo =
    getAgentInfo(agentName);


  const statusClass =
    execution.status === "succeeded"
      ? "completed"
      : execution.status === "failed"
        ? "failed"
        : "running";


  return (

    <div
      className="timeline-step"
      style={{
        marginBottom: 12,
      }}
    >

      {/* NUMBER */}

      <div className="timeline-num">
        {number}
      </div>


      <div
        style={{
          flex: 1,
        }}
      >

        {/* AGENT HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >

          <div>

            <strong
              style={{
                fontSize: 14,
              }}
            >
              {agentInfo.icon}{" "}
              {agentName}
            </strong>

            <div
              className="list-sub"
              style={{
                marginTop: 3,
              }}
            >
              {agentInfo.description}
            </div>

          </div>


          <span
            className={`badge badge-${statusClass}`}
          >
            {execution.status}
          </span>

        </div>


        {/* ERROR */}

        {execution.error_message && (

          <p className="error-text">
            {execution.error_message}
          </p>

        )}


        {/* ARTIFACT BUTTON */}

        <button
          className="btn btn-ghost"
          style={{
            marginTop: 10,
            fontSize: 12,
            padding: "5px 10px",
          }}
          onClick={onArtifacts}
        >

          {artifacts
            ? "Hide output"
            : "View agent output"}

        </button>


        {/* OUTPUT */}

        {artifacts && (

          <div
            style={{
              marginTop: 10,
            }}
          >

            {artifacts.length === 0 ? (

              <div className="list-sub">
                No output generated.
              </div>

            ) : (

              artifacts.map((a) => (

                <div
                  key={a.id}
                  style={{
                    marginBottom: 12,
                  }}
                >

                  <div
                    className="list-sub"
                    style={{
                      marginBottom: 5,
                    }}
                  >
                    📄 {a.name}
                  </div>

                  <div
                    className="artifact-block"
                    style={{
                      whiteSpace:
                        "pre-wrap",
                      lineHeight: 1.6,
                    }}
                  >
                    {a.content}
                  </div>

                </div>

              ))

            )}

          </div>
        )}

      </div>

    </div>
  );
}


/* =====================================================
   AGENT DESCRIPTIONS
===================================================== */

function getAgentInfo(agentName) {

  const name =
    agentName.toLowerCase();


  if (name.includes("planner")) {

    return {
      icon: "🧠",
      description:
        "Breaks the user's request into independent subtasks and assigns specialist agents.",
    };

  }


  if (name.includes("research")) {

    return {
      icon: "🔎",
      description:
        "Collects relevant information and research needed for the task.",
    };

  }


  if (name.includes("analyst")) {

    return {
      icon: "📊",
      description:
        "Analyzes requirements, options, risks, and strategy.",
    };

  }


  if (name.includes("developer")) {

    return {
      icon: "💻",
      description:
        "Handles software, technical implementation, and code-related work.",
    };

  }


  if (name.includes("designer")) {

    return {
      icon: "🎨",
      description:
        "Works on UI, UX, visual structure, and design requirements.",
    };

  }


  if (name.includes("writer")) {

    return {
      icon: "✍️",
      description:
        "Creates documents, plans, proposals, content, and written deliverables.",
    };

  }


  if (name.includes("supervisor")) {

    return {
      icon: "👨‍💼",
      description:
        "Combines specialist outputs into a coherent final result.",
    };

  }


  if (name.includes("qa")) {

    return {
      icon: "🧪",
      description:
        "Reviews the generated work for missing requirements, errors, and quality issues.",
    };

  }


  if (name.includes("auditor")) {

    return {
      icon: "🔍",
      description:
        "Performs the final validation and determines whether the workflow is ready.",
    };

  }


  return {
    icon: "🤖",
    description:
      "AI specialist working on the assigned task.",
  };
}

