import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Agents from "./pages/Agents";
import Knowledge from "./pages/Knowledge";

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />
      <Route path="/tasks" element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
      <Route path="/agents" element={<ProtectedLayout><Agents /></ProtectedLayout>} />
      <Route path="/knowledge" element={<ProtectedLayout><Knowledge /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
