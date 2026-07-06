import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = Object.fromEntries(new FormData(e.target));
    await login(username, password);
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-white">♟ Chess Tournament</h1>
        <p className="text-slate-400 text-sm">Sign in to manage tournaments</p>
        <input name="username" placeholder="Username" required className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
        <input name="password" type="password" placeholder="Password" required className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold transition">Sign In</button>
        <p className="text-center text-slate-400 text-sm">No account? <a href="/register" className="text-indigo-400 hover:underline">Register</a></p>
      </form>
    </div>
  );
}
