import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">♟ Chess Tournament Dashboard</h1>
          <button onClick={logout} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm transition">Sign out</button>
        </div>
        <p className="text-slate-400 mb-6">Welcome back, <span className="text-indigo-400 font-semibold">{user?.username}</span> ({user?.role})</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { to: "/players",     label: "🧑 Players",     desc: "Manage player profiles" },
            { to: "/tournaments", label: "🏆 Tournaments",  desc: "Browse & manage events" },
            { to: "/matches",     label: "⚔️ Matches",      desc: "View & simulate matches" },
          ].map(({ to, label, desc }) => (
            <Link key={to} to={to} className="bg-slate-800 hover:bg-slate-700 p-6 rounded-2xl transition block">
              <div className="text-2xl mb-2">{label}</div>
              <p className="text-slate-400 text-sm">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
