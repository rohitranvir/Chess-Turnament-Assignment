import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseError(err) {
  const data = err?.response?.data;
  if (!data) return "Network error. Is the server running?";
  if (data.error?.details && typeof data.error.details === "object") {
    return Object.entries(data.error.details)
      .map(([f, msgs]) => `${f}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`)
      .join(" · ");
  }
  if (data.error?.message) return data.error.message;
  if (data.detail) return data.detail;
  return "An unexpected error occurred.";
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function InputField({ id, label, type = "text", value, onChange, placeholder, autoComplete, required = true }) {
  const [focused, setFocused] = useState(false);
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
        required={required}
        style={{
          ...styles.input,
          ...(focused ? styles.inputFocus : {}),
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

function SelectField({ id, label, value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        style={{
          ...styles.input,
          ...(focused ? styles.inputFocus : {}),
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Password strength meter ──────────────────────────────────────────────────

function strengthScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score; // 0-4
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "#ef4444", "#f59e0b", "#10b981", "#6366f1"];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = strengthScore(password);
  return (
    <div style={{ marginTop: "0.4rem" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              backgroundColor: i <= score ? strengthColors[score] : "#334155",
              transition: "background-color 0.3s",
            }}
          />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: "0.75rem", color: strengthColors[score] }}>
        {strengthLabels[score]}
      </p>
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    role: "viewer",
  });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    if (!form.username.trim()) return "Username is required.";
    if (!form.email.trim())    return "Email is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.password2) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationErr = validate();
    if (validationErr) { setError(validationErr); return; }

    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.bgPattern} aria-hidden="true" />
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h2 style={{ color: "#f1f5f9", margin: "0 0 0.5rem" }}>Account Created!</h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgPattern} aria-hidden="true" />

      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.logoRow}>
          <span style={styles.logo}>♛</span>
          <div>
            <h1 style={styles.title}>Create Account</h1>
            <p style={styles.subtitle}>Join Chess Tournament Manager</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" style={styles.errorBanner}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <InputField
            id="username"
            label="Username"
            value={form.username}
            onChange={set("username")}
            placeholder="chess_master"
            autoComplete="username"
          />
          <InputField
            id="email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <div>
            <InputField
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
            <PasswordStrength password={form.password} />
          </div>

          <InputField
            id="password2"
            label="Confirm Password"
            type="password"
            value={form.password2}
            onChange={set("password2")}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />

          <SelectField
            id="role"
            label="Account Role"
            value={form.role}
            onChange={set("role")}
            options={[
              { value: "viewer", label: "👁 Viewer — read-only access" },
              { value: "admin",  label: "👑 Admin — full access" },
            ]}
          />

          <div style={styles.roleNote}>
            <strong>Viewer</strong> can browse all data. <strong>Admin</strong> can create, edit, and delete.
          </div>

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
                Creating account…
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
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
    padding: "2rem 1rem",
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
    maxWidth: "440px",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "1.25rem",
    padding: "2.5rem",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
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
    filter: "drop-shadow(0 0 12px rgba(245,158,11,0.5))",
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
  roleNote: {
    fontSize: "0.775rem",
    color: "#475569",
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "0.5rem",
    padding: "0.625rem 0.875rem",
    lineHeight: 1.5,
  },
  submitBtn: {
    width: "100%",
    marginTop: "0.25rem",
    padding: "0.8125rem",
    backgroundColor: "#4f46e5",
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.9375rem",
    border: "none",
    borderRadius: "0.625rem",
    cursor: "pointer",
    transition: "background-color 0.15s",
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
