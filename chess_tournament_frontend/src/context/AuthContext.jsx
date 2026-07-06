/**
 * AuthContext.jsx
 *
 * Provides:
 *  - user: { id, username, email, role } | null
 *  - isAdmin: boolean
 *  - isLoading: boolean  (true while checking initial localStorage state)
 *  - login(username, password) → Promise<user>
 *  - register(data) → Promise<user>
 *  - logout()
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { authAPI } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // initial hydration

  // Hydrate from localStorage on first mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      const token  = localStorage.getItem("access_token");
      if (stored && token) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // corrupted storage — clear it
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Authenticates and persists tokens + user info. */
  const login = useCallback(async (username, password) => {
    const { data } = await axiosClient.post("/auth/login/", { username, password });
    localStorage.setItem("access_token",  data.access);
    localStorage.setItem("refresh_token", data.refresh);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  /** Registers a new account (does NOT auto-login; redirect to /login). */
  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    return data;
  }, []);

  /** Clears all auth state and storage. */
  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
