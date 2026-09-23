
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

export function logout() {
  localStorage.removeItem("token");
}

async function request(
  path,
  { method = "GET", body, auth = true } = {}
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;

    try {
      const data = await res.json();

      if (typeof data.detail === "string") {
        detail = data.detail;
      } else if (data.detail) {
        detail = JSON.stringify(data.detail);
      }
    } catch {
      // Keep statusText if response is not JSON
    }

    throw new Error(
      detail || `Request failed (${res.status})`
    );
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  // =========================
  // AUTH
  // =========================

  login: async (email, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
      auth: false,
    });

    // Automatically save JWT token
    if (data.access_token) {
      setToken(data.access_token);
    }

    return data;
  },

  register: (email, full_name, password) =>
    request("/auth/register", {
      method: "POST",
      body: {
        email,
        full_name,
        password,
      },
      auth: false,
    }),

  me: () => request("/auth/me"),

  // =========================
  // PROJECTS
  // =========================

  listProjects: () =>
    request("/projects/"),

  createProject: (name, description) =>
    request("/projects/", {
      method: "POST",
      body: {
        name,
        description,
      },
    }),

  // =========================
  // TASKS
  // =========================

  listTasks: () =>
    request("/tasks/"),

  createTask: (title, instruction, project_id) =>
    request("/tasks/", {
      method: "POST",
      body: {
        title,
        instruction,
        project_id,
      },
    }),

  executeTask: (taskId, mode = "multi") =>
    request(
      `/tasks/${taskId}/execute?mode=${mode}`,
      {
        method: "POST",
      }
    ),

  getExecutions: (taskId) =>
    request(`/tasks/${taskId}/executions`),

  getArtifacts: (executionId) =>
    request(
      `/tasks/executions/${executionId}/artifacts`
    ),

  // =========================
  // AGENTS
  // =========================

  listAgents: () =>
    request("/agents/"),

  // =========================
  // KNOWLEDGE
  // =========================

  listKnowledge: () =>
    request("/knowledge/"),

  createKnowledge: (title, content, category) =>
    request("/knowledge/", {
      method: "POST",
      body: {
        title,
        content,
        category,
      },
    }),

  deleteKnowledge: (id) =>
    request(`/knowledge/${id}`, {
      method: "DELETE",
    }),
};

export { getToken };

