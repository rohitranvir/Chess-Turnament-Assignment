import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/",            label: "Dashboard", icon: "⊞" },
  { to: "/players",     label: "Players",   icon: "♟" },
  { to: "/tournaments", label: "Tournaments", icon: "🏆" },
  { to: "/matches",     label: "Matches",   icon: "⚔️" },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        {/* Brand */}
        <Link to="/" style={styles.brand}>
          <span style={styles.brandIcon}>♟</span>
          <span style={styles.brandText}>ChessTournament</span>
        </Link>

        {/* Desktop nav */}
        <nav style={styles.desktopNav}>
          {navLinks.map(({ to, label, icon }) => {
            const active = location.pathname === to ||
              (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                style={{ ...styles.navLink, ...(active ? styles.navLinkActive : {}) }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User badge + logout */}
        <div style={styles.userRow}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase() ?? "?"}</div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user?.username}</span>
              <span style={{
                ...styles.rolePill,
                ...(isAdmin ? styles.rolePillAdmin : styles.rolePillViewer),
              }}>
                {isAdmin ? "👑 Admin" : "👁 Viewer"}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign out">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "rgba(15,23,42,0.92)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1e293b",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 1.5rem",
    height: "64px",
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    textDecoration: "none",
    flexShrink: 0,
  },
  brandIcon: {
    fontSize: "1.6rem",
    filter: "drop-shadow(0 0 8px rgba(99,102,241,0.6))",
  },
  brandText: {
    fontWeight: 700,
    fontSize: "1.0625rem",
    color: "#f1f5f9",
    letterSpacing: "-0.01em",
  },
  desktopNav: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    flex: 1,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.4rem 0.75rem",
    borderRadius: "0.5rem",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#94a3b8",
    transition: "color 0.15s, background-color 0.15s",
  },
  navLinkActive: {
    color: "#a5b4fc",
    backgroundColor: "rgba(99,102,241,0.12)",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexShrink: 0,
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.875rem",
    flexShrink: 0,
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
  },
  userName: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#f1f5f9",
  },
  rolePill: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    padding: "0.1rem 0.4rem",
    borderRadius: "0.25rem",
    letterSpacing: "0.02em",
    marginTop: "0.15rem",
    display: "inline-block",
  },
  rolePillAdmin: {
    backgroundColor: "rgba(245,158,11,0.15)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.25)",
  },
  rolePillViewer: {
    backgroundColor: "rgba(99,102,241,0.1)",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,0.2)",
  },
  logoutBtn: {
    padding: "0.4rem 0.875rem",
    backgroundColor: "transparent",
    border: "1px solid #334155",
    borderRadius: "0.5rem",
    color: "#64748b",
    fontSize: "0.8125rem",
    cursor: "pointer",
    transition: "border-color 0.15s, color 0.15s",
    fontWeight: 500,
  },
};
