import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { playersAPI } from "../api";
import { useAuth } from "../context/AuthContext";

export default function PlayersPage() {
  const { isAdmin } = useAuth();
  
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentEditing, setCurrentEditing] = useState(null); // null = adding, object = editing
  const [form, setForm] = useState({ name: "", email: "", rating: 1200, country: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data } = await playersAPI.list();
      setPlayers(data.results || data); // handle paginated or unpaginated response
      setError(null);
    } catch (err) {
      setError("Failed to load players.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const openAddModal = () => {
    setCurrentEditing(null);
    setForm({ name: "", email: "", rating: 1200, country: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (player) => {
    setCurrentEditing(player);
    setForm({
      name: player.name,
      email: player.email,
      rating: player.rating,
      country: player.country || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return "Invalid email format.";
    if (form.rating < 0) return "Rating cannot be negative.";
    return null;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      if (currentEditing) {
        await playersAPI.update(currentEditing.id, form);
      } else {
        await playersAPI.create(form);
      }
      setModalOpen(false);
      fetchPlayers();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.error?.details) {
        setFormError(Object.values(data.error.details).flat().join(" "));
      } else if (data?.error?.message) {
        setFormError(data.error.message);
      } else {
        setFormError("An unexpected error occurred.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (player) => {
    setPlayerToDelete(player);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!playerToDelete) return;
    try {
      await playersAPI.remove(playerToDelete.id);
      setDeleteModalOpen(false);
      fetchPlayers();
    } catch (err) {
      alert("Failed to delete player.");
    }
  };

  return (
    <Layout>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>♟ Players</h1>
          <p style={styles.subtitle}>Manage tournament participants</p>
        </div>
        {isAdmin && (
          <button style={styles.primaryBtn} onClick={openAddModal}>
            + Add Player
          </button>
        )}
      </div>

      {loading ? (
        <div style={styles.centerBox}>Loading players...</div>
      ) : error ? (
        <div style={styles.errorBox}>{error}</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Rating</th>
                <th style={styles.th}>Country</th>
                {isAdmin && <th style={styles.thRight}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={styles.tdCenter}>
                    No players found.
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={player.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong style={{ color: "#f1f5f9" }}>{player.name}</strong>
                    </td>
                    <td style={styles.td}>{player.email}</td>
                    <td style={styles.td}>{player.rating}</td>
                    <td style={styles.td}>{player.country || "—"}</td>
                    {isAdmin && (
                      <td style={styles.tdRight}>
                        <button style={styles.actionBtn} onClick={() => openEditModal(player)}>Edit</button>
                        <button style={styles.dangerBtn} onClick={() => openDeleteModal(player)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={currentEditing ? "Edit Player" : "Add Player"}>
        <form onSubmit={handleFormSubmit} style={styles.form}>
          {formError && <div style={styles.formError}>{formError}</div>}
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name</label>
            <input name="name" value={form.name} onChange={handleFormChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleFormChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Rating</label>
            <input type="number" name="rating" value={form.rating} onChange={handleFormChange} style={styles.input} min="0" required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Country</label>
            <input name="country" value={form.country} onChange={handleFormChange} style={styles.input} placeholder="e.g. USA" />
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={() => setModalOpen(false)} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={formLoading} style={styles.submitBtn}>
              {formLoading ? "Saving..." : "Save Player"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
          Are you sure you want to delete <strong>{playerToDelete?.name}</strong>? This action cannot be undone.
        </p>
        <div style={styles.modalActions}>
          <button onClick={() => setDeleteModalOpen(false)} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleDelete} style={styles.deleteSubmitBtn}>Delete</button>
        </div>
      </Modal>
    </Layout>
  );
}

const styles = {
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" },
  title: { margin: "0 0 0.25rem", fontSize: "1.75rem", fontWeight: 700, color: "#f1f5f9" },
  subtitle: { margin: 0, color: "#64748b" },
  primaryBtn: { backgroundColor: "#4f46e5", color: "#fff", padding: "0.6rem 1.2rem", borderRadius: "0.5rem", border: "none", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" },
  centerBox: { padding: "3rem", textAlign: "center", color: "#64748b" },
  errorBox: { padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "0.5rem", border: "1px solid rgba(239, 68, 68, 0.2)" },
  tableContainer: { backgroundColor: "#1e293b", borderRadius: "1rem", border: "1px solid #334155", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: { padding: "1rem 1.5rem", borderBottom: "1px solid #334155", color: "#94a3b8", fontWeight: 600, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  thRight: { padding: "1rem 1.5rem", borderBottom: "1px solid #334155", color: "#94a3b8", fontWeight: 600, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" },
  tr: { borderBottom: "1px solid #334155", transition: "background 0.15s" },
  td: { padding: "1rem 1.5rem", color: "#cbd5e1", fontSize: "0.9375rem" },
  tdRight: { padding: "1rem 1.5rem", textAlign: "right" },
  tdCenter: { padding: "2rem 1.5rem", textAlign: "center", color: "#64748b" },
  actionBtn: { background: "transparent", border: "1px solid #4f46e5", color: "#818cf8", padding: "0.4rem 0.8rem", borderRadius: "0.375rem", fontSize: "0.8125rem", cursor: "pointer", marginRight: "0.5rem" },
  dangerBtn: { background: "transparent", border: "1px solid #ef4444", color: "#f87171", padding: "0.4rem 0.8rem", borderRadius: "0.375rem", fontSize: "0.8125rem", cursor: "pointer" },
  
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  formError: { padding: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "0.5rem", fontSize: "0.875rem", border: "1px solid rgba(239, 68, 68, 0.2)" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.875rem", fontWeight: 500, color: "#cbd5e1" },
  input: { padding: "0.6rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.5rem", color: "#f1f5f9", outline: "none", fontSize: "0.9375rem" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" },
  cancelBtn: { padding: "0.6rem 1rem", background: "transparent", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "0.5rem", cursor: "pointer" },
  submitBtn: { padding: "0.6rem 1.2rem", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" },
  deleteSubmitBtn: { padding: "0.6rem 1.2rem", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" },
};
