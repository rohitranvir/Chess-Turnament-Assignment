// src/routes/AppRouter.jsx
// Central routing configuration using react-router-dom v6

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Pages (created as stubs for now, ready to be fully implemented)
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import PlayersPage from "../pages/PlayersPage";
import TournamentsPage from "../pages/TournamentsPage";
import TournamentDetailPage from "../pages/TournamentDetailPage";
import MatchesPage from "../pages/MatchesPage";

/** Redirects unauthenticated users to /login. */
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

/** Redirects authenticated users away from auth pages. */
function GuestRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Protected */}
        <Route path="/"                       element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/players"                element={<PrivateRoute><PlayersPage /></PrivateRoute>} />
        <Route path="/tournaments"            element={<PrivateRoute><TournamentsPage /></PrivateRoute>} />
        <Route path="/tournaments/:id"        element={<PrivateRoute><TournamentDetailPage /></PrivateRoute>} />
        <Route path="/matches"                element={<PrivateRoute><MatchesPage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
