
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const CATEGORY_INFO = {
  company_rules: {
    icon: "📋",
    label: "Company Rules",
  },
  template: {
    icon: "🧩",
    label: "Templates",
  },
  reference: {
    icon: "📚",
    label: "References",
  },
  general: {
    icon: "📄",
    label: "General",
  },
};

function getCategoryInfo(category) {
  return (
    CATEGORY_INFO[category] || {
      icon: "📄",
      label: category
        ? category.replaceAll("_", " ")
        : "General",
    }
  );
}

export default function Knowledge() {
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("company_rules");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    try {
      setError("");
      setLoading(true);

      const data = await api.listKnowledge();
      setDocs(data);
    } catch (err) {
      setError(err.message || "Unable to load knowledge base.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setError("");
    setCreating(true);

    try {
      await api.createKnowledge(
        title.trim(),
        content.trim(),
        category
      );

      setTitle("");
      setContent("");
      setCategory("company_rules");

      await load();
    } catch (err) {
      setError(err.message || "Unable to save document.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Delete this knowledge document?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setDeletingId(id);

      await api.deleteKnowledge(id);
      await load();
    } catch (err) {
      setError(err.message || "Unable to delete document.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredDocs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return docs.filter((doc) => {
      const matchesCategory =
        filterCategory === "all" ||
        doc.category === filterCategory;

      const matchesSearch =
        !query ||
        doc.title?.toLowerCase().includes(query) ||
        doc.content?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [docs, search, filterCategory]);

  const categoryCounts = useMemo(() => {
    return {
      company_rules: docs.filter(
        (d) => d.category === "company_rules"
      ).length,
      template: docs.filter(
        (d) => d.category === "template"
      ).length,
      reference: docs.filter(
        (d) => d.category === "reference"
      ).length,
      general: docs.filter(
        (d) => d.category === "general"
      ).length,
    };
  }, [docs]);

  return (
    <div className="main">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Knowledge Center</h1>
          <p>
            Company rules, templates, and reference knowledge
            available to autonomous agents.
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

      {/* RAG status */}
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
            <div className="stat-label">
              KNOWLEDGE RETRIEVAL
            </div>

            <h2 style={{ margin: "6px 0 4px" }}>
              🧠 RAG Knowledge Base
            </h2>

            <p className="list-sub">
              Agents can use stored company knowledge as
              reference material when producing results.
            </p>
          </div>

          <div>
            <div className="stat-label">
              DOCUMENTS
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              {docs.length}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">TOTAL</div>
          <div className="stat-value">
            {docs.length}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">RULES</div>
          <div className="stat-value">
            {categoryCounts.company_rules}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">TEMPLATES</div>
          <div className="stat-value">
            {categoryCounts.template}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">REFERENCES</div>
          <div className="stat-value">
            {categoryCounts.reference}
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">GENERAL</div>
          <div className="stat-value">
            {categoryCounts.general}
          </div>
        </div>
      </div>

      {/* Add knowledge */}
      <div className="panel">
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>
            ➕ Add Knowledge
          </h2>

          <p className="list-sub">
            Store information that agents can reference during
            autonomous execution.
          </p>
        </div>

        <form onSubmit={handleCreate}>
          <div className="field">
            <label>Document title</label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Company AI Service Guidelines"
              required
              disabled={creating}
            />
          </div>

          <div className="field">
            <label>Category</label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={creating}
            >
              <option value="company_rules">
                Company Rules
              </option>
              <option value="template">
                Template
              </option>
              <option value="reference">
                Reference
              </option>
              <option value="general">
                General
              </option>
            </select>
          </div>

          <div className="field">
            <label>Content</label>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the knowledge, rule, template, or reference information..."
              rows={7}
              required
              disabled={creating}
            />
          </div>

          <button
            className="btn btn-accent"
            disabled={creating}
          >
            {creating
              ? "Saving knowledge..."
              : "Save knowledge"}
          </button>

          {error && (
            <p className="error-text">
              {error}
            </p>
          )}
        </form>
      </div>

      {/* Knowledge list */}
      <div className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              Knowledge Library
            </h2>

            <p className="list-sub">
              {filteredDocs.length} of {docs.length} documents
              shown
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge..."
              style={{
                minWidth: 200,
              }}
            />

            <select
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(e.target.value)
              }
            >
              <option value="all">All categories</option>
              <option value="company_rules">
                Company Rules
              </option>
              <option value="template">
                Templates
              </option>
              <option value="reference">
                References
              </option>
              <option value="general">
                General
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading knowledge base...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="empty-state">
            <div
              style={{
                fontSize: 34,
                marginBottom: 8,
              }}
            >
              🧠
            </div>

            <strong>
              {docs.length === 0
                ? "No knowledge documents yet"
                : "No matching documents"}
            </strong>

            <p className="list-sub">
              {docs.length === 0
                ? "Add your first company rule, template, or reference above."
                : "Try a different search term or category."}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {filteredDocs.map((doc) => {
              const categoryInfo = getCategoryInfo(
                doc.category
              );

              return (
                <div
                  key={doc.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 220,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 30 }}>
                      {categoryInfo.icon}
                    </div>

                    <span className="badge badge-pending">
                      {categoryInfo.label}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "14px 0 7px",
                    }}
                  >
                    {doc.title}
                  </h3>

                  <p
                    className="list-sub"
                    style={{
                      lineHeight: 1.5,
                      flex: 1,
                      margin: 0,
                    }}
                  >
                    {doc.content?.slice(0, 220)}
                    {doc.content?.length > 220
                      ? "..."
                      : ""}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        opacity: 0.55,
                      }}
                    >
                      KNOWLEDGE #{doc.id}
                    </span>

                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
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




