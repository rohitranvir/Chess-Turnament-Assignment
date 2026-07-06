/**
 * Layout.jsx
 * Wraps all protected pages with the Navbar + a consistent main content area.
 */
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
      <Navbar />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {children}
      </main>
    </div>
  );
}
