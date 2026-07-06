/**
 * AppRouter.jsx — Central route definitions with auth guards.
 *
 * Exports a named ProtectedRoute component for reuse in tests / other files.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import LoginPage          from "../pages/LoginPage";
import RegisterPage       from "../pages/RegisterPage";
import DashboardPage      from "../pages/DashboardPage";
import PlayersPage        from "../pages/PlayersPage";
import TournamentsPage    from "../pages/TournamentsPage";
import TournamentDetailPage from "../pages/TournamentDetailPage";
import MatchesPage        from "../pages/MatchesPage";

// ─── Auth guards ──────────────────────────────────────────────────────────────

/**
 * ProtectedRoute — redirects to /login if the user is not authenticated.
 * While the auth state is hydrating from localStorage, renders a full-screen
 * loading indicator to avoid a flash of the login page.
 */
export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

/**
 * GuestRoute — redirects authenticated users away from auth pages to "/".
 */
function GuestRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null; // brief blank during hydration is fine on auth pages
  return !user ? children : <Navigate to="/" replace />;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public auth routes ── */}
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* ── Protected application routes ── */}
        <Route path="/"                element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/players"         element={<ProtectedRoute><PlayersPage /></ProtectedRoute>} />
        <Route path="/tournaments"     element={<ProtectedRoute><TournamentsPage /></ProtectedRoute>} />
        <Route path="/tournaments/:id" element={<ProtectedRoute><TournamentDetailPage /></ProtectedRoute>} />
        <Route path="/matches"         element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
