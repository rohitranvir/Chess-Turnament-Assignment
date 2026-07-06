import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { tournamentsAPI, playersAPI, matchesAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";

// Helper components for the page
const SectionCard = ({ title, children, actions }) => (
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <h2 style={styles.cardTitle}>{title}</h2>
      {actions && <div>{actions}</div>}
    </div>
    <div style={styles.cardContent}>{children}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    upcoming: { bg: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "rgba(56, 189, 248, 0.3)" },
    ongoing:  { bg: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "rgba(52, 211, 153, 0.3)" },
    completed:{ bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", border: "rgba(148, 163, 184, 0.3)" },
  };
  const c = colors[status] || colors.upcoming;
  return (
    <span style={{
      backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`,
      padding: "0.3rem 0.75rem", borderRadius: "1rem", fontSize: "0.8125rem", fontWeight: 600, textTransform: "capitalize"
    }}>
      {status}
    </span>
  );
};

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  
  // Data states
  const [tournament, setTournament] = useState(null);
  const [enrolledPlayers, setEnrolledPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rankings, setRankings] = useState([]);
  
  // Extra states for dropdowns/inputs
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState("");
  const [roundToGenerate, setRoundToGenerate] = useState("");
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, pRes, mRes, rRes, allPRes] = await Promise.all([
        tournamentsAPI.get(id),
        tournamentsAPI.players(id),
        matchesAPI.list({ tournament_id: id }),
        tournamentsAPI.rankings(id),
        playersAPI.list()
      ]);
      
      setTournament(tRes.data);
      setEnrolledPlayers(pRes.data);
      setMatches(mRes.data.results || mRes.data);
      setRankings(rRes.data);
      setAllPlayers(allPRes.data.results || allPRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load tournament data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Handle Add Player
  const handleAddPlayer = async () => {
    if (!selectedPlayerToAdd) return;
    try {
      await tournamentsAPI.addPlayer(id, selectedPlayerToAdd);
      toast.success("Player added to tournament");
      setSelectedPlayerToAdd("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to add player.");
    }
  };

  // Handle Remove Player
  const handleRemovePlayer = async (playerId) => {
    if (!window.confirm("Remove this player from the tournament?")) return;
    try {
      await tournamentsAPI.removePlayer(id, playerId);
      toast.success("Player removed from tournament");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to remove player.");
    }
  };

  // Handle Generate Matches
  const handleGenerateMatches = async (e) => {
    e.preventDefault();
    if (!roundToGenerate) return;
    try {
      await tournamentsAPI.generateMatches(id, parseInt(roundToGenerate));
      toast.success(`Matches generated for Round ${roundToGenerate}`);
      setRoundToGenerate("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to generate matches.");
    }
  };

  // Handle Simulate Round
  const handleSimulateRound = async (roundNum) => {
    if (!window.confirm(`Simulate all pending matches in Round ${roundNum}?`)) return;
    try {
      await tournamentsAPI.simulateRound(id, roundNum);
      toast.success(`Round ${roundNum} simulated`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to simulate round.");
    }
  };

  if (loading) {
    return <Layout><Spinner fullPage /></Layout>;
  }

  if (error || !tournament) {
    return <Layout><div style={styles.errorBox}>{error || "Tournament not found"}</div></Layout>;
  }

  // Filter out players already in the tournament for the dropdown
  const enrolledIds = new Set(enrolledPlayers.map(p => p.player_details.id));
  const availablePlayers = allPlayers.filter(p => !enrolledIds.has(p.id));

  // Group matches by round for easier display
  const matchesByRound = {};
  matches.forEach(m => {
    if (!matchesByRound[m.round_number]) matchesByRound[m.round_number] = [];
    matchesByRound[m.round_number].push(m);
  });
  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => parseInt(b) - parseInt(a)); // desc

  return (
    <Layout>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Link to="/tournaments" style={styles.backLink}>← Back to Tournaments</Link>
          <h1 style={styles.title}>{tournament.name}</h1>
          <p style={styles.dateText}>{tournament.start_date} to {tournament.end_date}</p>
        </div>
        <div>
          <StatusBadge status={tournament.status} />
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left Column: Players & Rankings */}
        <div style={styles.col}>
          {/* Rankings Section */}
          <SectionCard title="Leaderboard">
            {rankings.length === 0 ? (
              <p style={styles.emptyText}>No rankings available yet.</p>
            ) : (
              <div style={styles.rankingsList}>
                {rankings.map((r, idx) => {
                  let badge = null;
                  if (idx === 0) badge = "🥇 1st";
                  else if (idx === 1) badge = "🥈 2nd";
                  else if (idx === 2) badge = "🥉 3rd";
                  else badge = `${idx + 1}th`;

                  const isPodium = idx < 3;

                  return (
                    <div key={r.player_id} style={{
                      ...styles.rankingRow,
                      backgroundColor: isPodium ? "rgba(99,102,241,0.05)" : "transparent",
                      borderColor: isPodium ? "rgba(99,102,241,0.15)" : "#334155"
                    }}>
                      <div style={styles.rankingLeft}>
                        <span style={{ 
                          ...styles.rankBadge, 
                          color: idx === 0 ? "#fbbf24" : idx === 1 ? "#94a3b8" : idx === 2 ? "#b45309" : "#64748b" 
                        }}>
                          {badge}
                        </span>
                        <span style={styles.rankingName}>{r.player_name}</span>
                      </div>
                      <div style={styles.rankingRight}>
                        <span style={styles.points}>{r.points} pts</span>
                        <span style={styles.wins}>({r.tiebreaker_wins} wins)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Players Section */}
          <SectionCard 
            title={`Enrolled Players (${enrolledPlayers.length})`}
            actions={
              isAdmin && tournament.status !== 'completed' && (
                <div style={styles.addPlayerRow}>
                  <select 
                    value={selectedPlayerToAdd} 
                    onChange={e => setSelectedPlayerToAdd(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">-- Select Player --</option>
                    {availablePlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.rating})</option>
                    ))}
                  </select>
                  <button style={styles.actionBtn} onClick={handleAddPlayer} disabled={!selectedPlayerToAdd}>
                    Add
                  </button>
                </div>
              )
            }
          >
            {enrolledPlayers.length === 0 ? (
              <p style={styles.emptyText}>No players enrolled yet.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Rating</th>
                    <th style={styles.th}>Joined</th>
                    {isAdmin && tournament.status !== 'completed' && <th style={styles.thRight}></th>}
                  </tr>
                </thead>
                <tbody>
                  {enrolledPlayers.map(ep => (
                    <tr key={ep.id} style={styles.tr}>
                      <td style={styles.td}><strong>{ep.player_details.name}</strong></td>
                      <td style={styles.td}>{ep.player_details.rating}</td>
                      <td style={styles.td}>{new Date(ep.joined_at).toLocaleDateString()}</td>
                      {isAdmin && tournament.status !== 'completed' && (
                        <td style={styles.tdRight}>
                          <button style={styles.dangerBtnSmall} onClick={() => handleRemovePlayer(ep.player_details.id)}>
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        {/* Right Column: Matches */}
        <div style={styles.col}>
          <SectionCard 
            title="Matches"
            actions={
              isAdmin && tournament.status !== 'completed' && (
                <form onSubmit={handleGenerateMatches} style={styles.generateForm}>
                  <input 
                    type="number" 
                    min="1" 
                    placeholder="Round #" 
                    value={roundToGenerate}
                    onChange={e => setRoundToGenerate(e.target.value)}
                    style={styles.inputSmall}
                    required
                  />
                  <button type="submit" style={styles.primaryBtnSmall}>Generate</button>
                </form>
              )
            }
          >
            {sortedRounds.length === 0 ? (
              <p style={styles.emptyText}>No matches generated yet.</p>
            ) : (
              sortedRounds.map(roundNum => (
                <div key={roundNum} style={styles.roundGroup}>
                  <div style={styles.roundHeader}>
                    <h3 style={styles.roundTitle}>Round {roundNum}</h3>
                    {isAdmin && tournament.status !== 'completed' && matchesByRound[roundNum].some(m => m.result === 'pending') && (
                      <button 
                        style={styles.simulateBtn} 
                        onClick={() => handleSimulateRound(roundNum)}
                      >
                        ⚡ Simulate Round
                      </button>
                    )}
                  </div>
                  <table style={styles.table}>
                    <tbody>
                      {matchesByRound[roundNum].map(match => (
                        <tr key={match.id} style={styles.tr}>
                          <td style={styles.td}>
                            {match.player_white_details?.name || "Bye"} (W)
                            <br/>
                            <span style={styles.vs}>vs</span>
                            <br/>
                            {match.player_black_details?.name || "Bye"} (B)
                          </td>
                          <td style={styles.tdRight}>
                            <span style={{
                              ...styles.resultBadge,
                              backgroundColor: match.result === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(52,211,153,0.1)',
                              color: match.result === 'pending' ? '#fbbf24' : '#34d399',
                              border: `1px solid ${match.result === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(52,211,153,0.2)'}`
                            }}>
                              {match.result.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </SectionCard>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  centerBox: { padding: "4rem", textAlign: "center", color: "#64748b" },
  errorBox: { padding: "1.5rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "0.5rem", border: "1px solid rgba(239, 68, 68, 0.2)", textAlign: "center" },
  errorBanner: { marginBottom: "1.5rem", padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "0.5rem", border: "1px solid rgba(239, 68, 68, 0.2)" },
  
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", borderBottom: "1px solid #1e293b", paddingBottom: "1.5rem" },
  headerLeft: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  backLink: { color: "#818cf8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem", display: "inline-block" },
  title: { margin: 0, fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" },
  dateText: { margin: 0, color: "#94a3b8", fontSize: "0.9375rem" },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" },
  col: { display: "flex", flexDirection: "column", gap: "1.5rem" },

  card: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "1rem", overflow: "hidden" },
  cardHeader: { padding: "1.25rem 1.5rem", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15,23,42,0.3)" },
  cardTitle: { margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#f1f5f9" },
  cardContent: { padding: "1.5rem" },
  emptyText: { margin: 0, color: "#64748b", fontStyle: "italic" },

  addPlayerRow: { display: "flex", gap: "0.5rem" },
  select: { padding: "0.4rem 0.75rem", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.5rem", color: "#f1f5f9", fontSize: "0.875rem", outline: "none" },
  actionBtn: { padding: "0.4rem 0.875rem", backgroundColor: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" },
  
  generateForm: { display: "flex", gap: "0.5rem" },
  inputSmall: { width: "80px", padding: "0.4rem 0.75rem", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "0.5rem", color: "#f1f5f9", fontSize: "0.875rem", outline: "none" },
  primaryBtnSmall: { padding: "0.4rem 0.875rem", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" },
  simulateBtn: { padding: "0.35rem 0.75rem", backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" },

  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: { padding: "0.75rem 0", borderBottom: "1px solid #334155", color: "#94a3b8", fontWeight: 600, fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  thRight: { padding: "0.75rem 0", borderBottom: "1px solid #334155", textAlign: "right" },
  tr: { borderBottom: "1px solid #334155" },
  td: { padding: "0.75rem 0", color: "#cbd5e1", fontSize: "0.875rem", verticalAlign: "middle" },
  tdRight: { padding: "0.75rem 0", textAlign: "right", verticalAlign: "middle" },
  dangerBtnSmall: { background: "transparent", border: "1px solid #ef4444", color: "#f87171", padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "0.75rem", cursor: "pointer" },
  
  vs: { fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0", display: "inline-block", fontStyle: "italic" },
  resultBadge: { padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.05em" },

  roundGroup: { marginBottom: "2rem", border: "1px solid #334155", borderRadius: "0.75rem", overflow: "hidden" },
  roundHeader: { padding: "0.75rem 1rem", backgroundColor: "rgba(15,23,42,0.5)", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" },
  roundTitle: { margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "#f1f5f9" },

  rankingsList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  rankingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #334155" },
  rankingLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  rankBadge: { fontWeight: 800, fontSize: "0.875rem", minWidth: "40px" },
  rankingName: { fontWeight: 600, color: "#f1f5f9" },
  rankingRight: { display: "flex", alignItems: "center", gap: "0.5rem" },
  points: { fontWeight: 700, color: "#a5b4fc" },
  wins: { fontSize: "0.75rem", color: "#64748b" },
};

// Add responsive styling via a quick inline media query script
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(style);
}
