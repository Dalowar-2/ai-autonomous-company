import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/projects", label: "Projects" },
  { to: "/tasks", label: "Tasks" },
  { to: "/agents", label: "Agents" },
  { to: "/knowledge", label: "Knowledge base" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sidebar">
      <div>
        <div className="brand">AI Autonomous Co.</div>
        <div className="brand-sub">Multi-agent work platform</div>
      </div>
      <div>
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="sidebar-footer">
        <div style={{ marginBottom: 8 }}>{user?.full_name}</div>
        <button onClick={logout}>Sign out</button>
      </div>
    </nav>
  );
}
