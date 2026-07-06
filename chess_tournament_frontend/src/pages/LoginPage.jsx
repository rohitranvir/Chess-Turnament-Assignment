import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract a human-readable error string from an Axios error. */
function parseError(err) {
  const data = err?.response?.data;
  if (!data) return "Network error. Is the server running?";

  // Our global handler wraps errors as { error: { message, details } }
  if (data.error?.message) {
    const details = data.error.details;
    if (details && typeof details === "object") {
      const fieldErrors = Object.entries(details)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`)
        .join(" | ");
      return fieldErrors || data.error.message;
    }
    return data.error.message;
  }

  // simplejwt returns { detail: "..." } on bad credentials
  if (data.detail) return data.detail;

  return "An unexpected error occurred.";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({ id, label, type = "text", value, onChange, placeholder, autoComplete, error }) {
  return (
    <div>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{
          ...styles.input,
          ...(error ? styles.inputError : {}),
        }}
        onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
        onBlur={e => {
          e.target.style.borderColor = error ? "#f87171" : "#334155";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Chess board ambient pattern */}
      <div style={styles.bgPattern} aria-hidden="true" />

      <div style={styles.card}>
        {/* Logo / Brand */}
        <div style={styles.logoRow}>
          <span style={styles.logo}>♟</span>
          <div>
            <h1 style={styles.title}>Chess Tournament</h1>
            <p style={styles.subtitle}>Sign in to your account</p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" style={styles.errorBanner}>
            <span style={{ fontSize: "1rem" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <InputField
            id="username"
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="your_username"
            autoComplete="username"
          />
          <InputField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {}),
            }}
          >
            {loading ? (
              <span style={styles.spinnerRow}>
                <span style={styles.spinner} />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Link to="/register" style={styles.link}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    position: "relative",
    overflow: "hidden",
    padding: "1rem",
  },
  bgPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "1.25rem",
    padding: "2.5rem",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "2rem",
  },
  logo: {
    fontSize: "2.5rem",
    lineHeight: 1,
    filter: "drop-shadow(0 0 12px rgba(99,102,241,0.5))",
  },
  title: {
    margin: 0,
    fontSize: "1.375rem",
    fontWeight: 700,
    color: "#f1f5f9",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "0.2rem 0 0",
    fontSize: "0.8rem",
    color: "#64748b",
  },
  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
    backgroundColor: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "0.625rem",
    padding: "0.75rem 1rem",
    marginBottom: "1.25rem",
    color: "#fca5a5",
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.125rem",
  },
  label: {
    display: "block",
    marginBottom: "0.4rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "#94a3b8",
    letterSpacing: "0.02em",
  },
  input: {
    width: "100%",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "0.625rem",
    padding: "0.75rem 1rem",
    fontSize: "0.9375rem",
    color: "#f1f5f9",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  },
  inputFocus: {
    borderColor: "#6366f1",
    boxShadow: "0 0 0 3px rgba(99,102,241,0.2)",
  },
  inputError: {
    borderColor: "#f87171",
  },
  submitBtn: {
    width: "100%",
    marginTop: "0.5rem",
    padding: "0.8125rem",
    backgroundColor: "#4f46e5",
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.9375rem",
    border: "none",
    borderRadius: "0.625rem",
    cursor: "pointer",
    transition: "background-color 0.15s, transform 0.1s",
    letterSpacing: "0.01em",
  },
  submitBtnDisabled: {
    backgroundColor: "#4338ca",
    cursor: "not-allowed",
    opacity: 0.75,
  },
  spinnerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  spinner: {
    display: "inline-block",
    width: "1rem",
    height: "1rem",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  footerText: {
    marginTop: "1.5rem",
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#64748b",
  },
  link: {
    color: "#818cf8",
    textDecoration: "none",
    fontWeight: 500,
  },
};
