import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { tournamentsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";

export default function TournamentsPage() {
  const { isAdmin } = useAuth();
  
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentEditing, setCurrentEditing] = useState(null);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", status: "upcoming" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const { data } = await tournamentsAPI.list();
      setTournaments(data.results || data);
      setError(null);
    } catch (err) {
      setError("Failed to load tournaments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const openAddModal = () => {
    setCurrentEditing(null);
    setForm({ name: "", start_date: "", end_date: "", status: "upcoming" });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (tournament) => {
    setCurrentEditing(tournament);
    setForm({
      name: tournament.name,
      start_date: tournament.start_date || "",
      end_date: tournament.end_date || "",
      status: tournament.status || "upcoming",
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
    if (!form.start_date) return "Start date is required.";
    if (!form.end_date) return "End date is required.";
    if (new Date(form.end_date) < new Date(form.start_date)) {
      return "End date must be after or equal to the start date.";
    }
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
        await tournamentsAPI.update(currentEditing.id, form);
        toast.success("Tournament updated successfully");
      } else {
        await tournamentsAPI.create(form);
        toast.success("Tournament created successfully");
      }
      setModalOpen(false);
      fetchTournaments();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.error?.details) {
        toast.error(Object.values(data.error.details).flat().join(" "));
      } else if (data?.error?.message) {
        toast.error(data.error.message);
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (tournament) => {
    setTournamentToDelete(tournament);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!tournamentToDelete) return;
    try {
      await tournamentsAPI.remove(tournamentToDelete.id);
      toast.success("Tournament deleted successfully");
      setDeleteModalOpen(false);
      fetchTournaments();
    } catch (err) {
      toast.error("Failed to delete tournament.");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      upcoming: { bg: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "rgba(56, 189, 248, 0.3)" },
      ongoing:  { bg: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "rgba(52, 211, 153, 0.3)" },
      completed:{ bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", border: "rgba(148, 163, 184, 0.3)" },
    };
    const c = colors[status] || colors.upcoming;
    return (
      <span style={{
        backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`,
        padding: "0.2rem 0.6rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize"
      }}>
        {status}
      </span>
    );
  };

  return (
    <Layout>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>🏆 Tournaments</h1>
          <p style={styles.subtitle}>Manage chess events and competitions</p>
        </div>
        {isAdmin && (
          <button style={styles.primaryBtn} onClick={openAddModal}>
            + Add Tournament
          </button>
        )}
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : error ? (
        <div style={styles.errorBox}>{error}</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Dates</th>
                <th style={styles.th}>Status</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.length === 0 ? (
                <tr>
                  <td colSpan={4} style={styles.tdCenter}>
                    No tournaments found.
                  </td>
                </tr>
              ) : (
                tournaments.map((tournament) => (
                  <tr key={tournament.id} style={styles.tr}>
                    <td style={styles.td}>
                      <Link to={`/tournaments/${tournament.id}`} style={styles.link}>
                        {tournament.name}
                      </Link>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>{tournament.start_date}</span> to <span style={styles.dateText}>{tournament.end_date}</span>
                    </td>
                    <td style={styles.td}>{getStatusBadge(tournament.status)}</td>
                    <td style={styles.tdRight}>
                      <Link to={`/tournaments/${tournament.id}`} style={styles.viewBtn}>View</Link>
                      {isAdmin && (
                        <>
                          <button style={styles.actionBtn} onClick={() => openEditModal(tournament)}>Edit</button>
                          <button style={styles.dangerBtn} onClick={() => openDeleteModal(tournament)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={currentEditing ? "Edit Tournament" : "Add Tournament"}>
        <form onSubmit={handleFormSubmit} style={styles.form}>
          {formError && <div style={styles.formError}>{formError}</div>}
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name</label>
            <input name="name" value={form.name} onChange={handleFormChange} style={styles.input} required />
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>Start Date</label>
              <input type="date" name="start_date" value={form.start_date} onChange={handleFormChange} style={styles.input} required />
            </div>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>End Date</label>
              <input type="date" name="end_date" value={form.end_date} onChange={handleFormChange} style={styles.input} required />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Status</label>
            <select name="status" value={form.status} onChange={handleFormChange} style={styles.input}>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={() => setModalOpen(false)} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={formLoading} style={styles.submitBtn}>
              {formLoading ? "Saving..." : "Save Tournament"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
          Are you sure you want to delete <strong>{tournamentToDelete?.name}</strong>? This action cannot be undone.
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
  link: { color: "#f1f5f9", fontWeight: 600, textDecoration: "none", transition: "color 0.2s" },
  dateText: { color: "#94a3b8", fontSize: "0.875rem" },
  viewBtn: { textDecoration: "none", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", padding: "0.4rem 0.8rem", borderRadius: "0.375rem", fontSize: "0.8125rem", marginRight: "0.5rem", border: "1px solid rgba(99,102,241,0.2)" },
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
