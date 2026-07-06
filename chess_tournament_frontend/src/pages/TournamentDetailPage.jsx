import { useParams } from "react-router-dom";
import Layout from "../components/Layout";

export default function TournamentDetailPage() {
  const { id } = useParams();
  return (
    <Layout>
      <h1 style={{ color: "#f1f5f9", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        🏆 Tournament #{id}
      </h1>
      <p style={{ color: "#64748b" }}>Tournament detail view — coming in the next sprint.</p>
    </Layout>
  );
}
