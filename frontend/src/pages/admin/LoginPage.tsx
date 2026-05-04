import { useState } from "react";
import api from "../../services/api";

const LoginPage = () => {
  const [role, setRole] = useState<"admin" | "teacher">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = role === "admin" ? "/admin/login" : "/teachers/login";
      const res = await api.post(endpoint, { username, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      setTimeout(() => {
        window.location.href =
          role === "admin" ? "/admin/dashboard" : "/teacher/students";
      }, 400);
    } catch (err: any) {
      setError(err.response?.data?.message || "Giriş başarısız.");
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">

        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Giriş</h1>
        </div>

        {/* Role toggle */}
        <div className="flex mb-5 border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => { setRole("admin"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium transition ${
              role === "admin"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => { setRole("teacher"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium transition ${
              role === "teacher"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            Hoca
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              disabled={isSubmitting}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
              className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm
              focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900
              disabled:opacity-50"
            />
            <label className="pointer-events-none absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
              transition-all
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
              peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
              peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs">
              Kullanıcı Adı
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder=" "
              className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm
              focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900
              disabled:opacity-50"
            />
            <label className="pointer-events-none absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
              transition-all
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
              peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
              peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs">
              Şifre
            </label>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 mt-3 animate-pulse">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={isSubmitting}
          className="w-full mt-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg
          hover:bg-black active:scale-[0.98] transition
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
