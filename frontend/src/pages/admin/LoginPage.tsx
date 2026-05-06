import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useTheme } from "../../ThemeContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"admin" | "teacher">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => { document.title = "Giriş"; }, []);

  const handleLogin = async () => {
    if (isSubmitting) return;

    if (!username.trim() || !password) {
      setError("Kullanıcı adı ve şifre zorunludur.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = role === "admin" ? "/admin/login" : "/teachers/login";
      const res = await api.post(endpoint, { username, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      navigate(role === "admin" ? "/admin/dashboard" : "/teacher/students", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Giriş başarısız.");
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      {/* Tema butonu */}
      <button
        onClick={toggle}
        className="fixed top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors
          bg-gray-900 text-white dark:bg-white dark:text-gray-900 z-50"
        title={theme === "dark" ? "Aydınlık tema" : "Karanlık tema"}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>

      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8">

        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Giriş</h1>
        </div>

        {/* Role toggle */}
        <div className="flex mb-5 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => { setRole("admin"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium transition ${
              role === "admin"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => { setRole("teacher"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium transition ${
              role === "teacher"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
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
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder=" "
              className="peer w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 pt-5 pb-2 text-sm
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              focus:outline-none focus:border-gray-900 dark:focus:border-gray-100
              focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100
              disabled:opacity-50"
            />
            <label className="pointer-events-none absolute left-3 top-2 text-gray-400 dark:text-gray-500 text-sm
              bg-white dark:bg-gray-800 px-1 transition-all
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
              peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900 dark:peer-focus:text-gray-100
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
              className="peer w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 pt-5 pb-2 text-sm
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              focus:outline-none focus:border-gray-900 dark:focus:border-gray-100
              focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100
              disabled:opacity-50"
            />
            <label className="pointer-events-none absolute left-3 top-2 text-gray-400 dark:text-gray-500 text-sm
              bg-white dark:bg-gray-800 px-1 transition-all
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
              peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900 dark:peer-focus:text-gray-100
              peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs">
              Şifre
            </label>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 mt-3">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={isSubmitting}
          className="w-full mt-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg
          hover:bg-black dark:hover:bg-gray-100 active:scale-[0.98] transition
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
