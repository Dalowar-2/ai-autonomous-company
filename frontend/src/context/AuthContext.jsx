
import { createContext, useContext, useEffect, useState } from "react";

import { api, logout as clearToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing login when app starts
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .me()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Login
  async function login(email, password) {
    const data = await api.login(email, password);

    // api.login() already saves the token
    if (!data.access_token) {
      throw new Error("Login successful but access token was not received.");
    }

    const userData = await api.me();

    setUser(userData);
  }

  // Logout
  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

