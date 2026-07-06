import { authAPI } from "../api";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    await authAPI.register(data);
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-white">♟ Create Account</h1>
        <input name="username" placeholder="Username" required className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
        <input name="email" type="email" placeholder="Email" required className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
        <input name="password" type="password" placeholder="Password" required className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
        <input name="password2" type="password" placeholder="Confirm Password" required className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
        <select name="role" className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg outline-none">
          <option value="viewer">Viewer (read-only)</option>
          <option value="admin">Admin (full access)</option>
        </select>
        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold transition">Register</button>
        <p className="text-center text-slate-400 text-sm">Already have an account? <a href="/login" className="text-indigo-400 hover:underline">Sign in</a></p>
      </form>
    </div>
  );
}
