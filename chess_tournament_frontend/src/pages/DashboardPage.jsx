import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

const stats = [
  { label: "Players",     icon: "♟", to: "/players",     color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
  { label: "Tournaments", icon: "🏆", to: "/tournaments", color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  { label: "Matches",     icon: "⚔️", to: "/matches",     color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  return (
    <Layout>
      {/* Welcome header */}
      <div style={styles.hero}>
        <div>
          <h1 style={styles.heroTitle}>
            Welcome back, <span style={styles.heroName}>{user?.username}</span> 👋
          </h1>
          <p style={styles.heroSub}>
            {isAdmin
              ? "You have full admin access — you can create, edit, and manage all data."
              : "You have viewer access — you can browse all tournament data."}
          </p>
        </div>
        <div style={{
          ...styles.roleBadge,
          ...(isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeViewer),
        }}>
          {isAdmin ? "👑 Admin" : "👁 Viewer"}
        </div>
      </div>

      {/* Navigation cards */}
      <div style={styles.grid}>
        {stats.map(({ label, icon, to, color, bg }) => (
          <Link key={to} to={to} style={{ ...styles.card, borderColor: "rgba(99,102,241,0.1)" }}>
            <div style={{ ...styles.cardIcon, color, backgroundColor: bg }}>{icon}</div>
            <h2 style={{ ...styles.cardTitle, color }}>{label}</h2>
            <p style={styles.cardDesc}>
              {label === "Players"     && "Browse and manage player profiles and ratings."}
              {label === "Tournaments" && "Create tournaments, enroll players, and track status."}
              {label === "Matches"     && "Generate rounds, simulate matches, and view results."}
            </p>
            <div style={{ ...styles.cardArrow, color }}>→</div>
          </Link>
        ))}
      </div>

      {/* Quick info */}
      <div style={styles.infoBox}>
        <span style={styles.infoIcon}>ℹ️</span>
        <p style={styles.infoText}>
          Full role-based permissions are enforced: write operations (create, edit, delete, simulate)
          are restricted to <strong style={{ color: "#fbbf24" }}>admin</strong> accounts.
          All accounts can read data and view rankings.
        </p>
      </div>
    </Layout>
  );
}

const styles = {
  hero: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "2.5rem",
  },
  heroTitle: {
    margin: "0 0 0.5rem",
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#f1f5f9",
    lineHeight: 1.3,
  },
  heroName: {
    color: "#a5b4fc",
  },
  heroSub: {
    margin: 0,
    color: "#64748b",
    fontSize: "0.9rem",
    maxWidth: "480px",
    lineHeight: 1.6,
  },
  roleBadge: {
    padding: "0.35rem 0.875rem",
    borderRadius: "2rem",
    fontWeight: 700,
    fontSize: "0.8125rem",
    letterSpacing: "0.02em",
    flexShrink: 0,
    alignSelf: "flex-start",
  },
  roleBadgeAdmin: {
    backgroundColor: "rgba(245,158,11,0.12)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.25)",
  },
  roleBadgeViewer: {
    backgroundColor: "rgba(99,102,241,0.1)",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,0.2)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.25rem",
    marginBottom: "2.5rem",
  },
  card: {
    display: "block",
    backgroundColor: "#1e293b",
    border: "1px solid #1e293b",
    borderRadius: "1rem",
    padding: "1.75rem",
    textDecoration: "none",
    transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
    cursor: "pointer",
  },
  cardIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "0.75rem",
    fontSize: "1.5rem",
    marginBottom: "1rem",
  },
  cardTitle: {
    margin: "0 0 0.5rem",
    fontSize: "1.125rem",
    fontWeight: 700,
  },
  cardDesc: {
    margin: "0 0 1rem",
    color: "#64748b",
    fontSize: "0.875rem",
    lineHeight: 1.6,
  },
  cardArrow: {
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  infoBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    backgroundColor: "rgba(99,102,241,0.06)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: "0.75rem",
    padding: "1rem 1.25rem",
  },
  infoIcon: { fontSize: "1.1rem", flexShrink: 0, marginTop: "0.1rem" },
  infoText: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#64748b",
    lineHeight: 1.6,
  },
};
