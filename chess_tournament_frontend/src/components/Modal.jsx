import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "1rem",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90vh",
  },
  header: {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid #334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#f1f5f9",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "1.25rem",
    cursor: "pointer",
    padding: "0.25rem",
    lineHeight: 1,
    transition: "color 0.2s",
  },
  content: {
    padding: "1.5rem",
    overflowY: "auto",
  },
};
