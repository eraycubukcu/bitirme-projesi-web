import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../ThemeContext";

const TeacherLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/admin/login", { replace: true });
  };

  const ThemeBtn = () => (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors
        bg-gray-900 text-white dark:bg-white dark:text-gray-900"
      title={theme === "dark" ? "Aydınlık tema" : "Karanlık tema"}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );

  const Sidebar = () => (
    <div className="flex flex-col h-full p-5">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold dark:text-gray-100">Hoca Paneli</h1>
          <p className="text-xs text-gray-400">Danışman Sistemi</p>
        </div>
        <ThemeBtn />
      </div>
      <nav className="space-y-1 flex-1">
        <Link
          to="/teacher/students"
          onClick={() => setOpen(false)}
          className={`block px-3 py-2 rounded-lg text-sm transition
          ${location.pathname === "/teacher/students"
            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          Öğrenci Onay Listesi
        </Link>
      </nav>
      <button
        onClick={handleLogout}
        className="text-sm text-red-500 hover:text-red-700 transition text-left pt-4 border-t dark:border-gray-700"
      >
        Çıkış Yap
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Mobil üst bar ────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b dark:border-gray-700
        flex items-center px-4 z-40">
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5
          rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Menü"
        >
          <span className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
          <span className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
          <span className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
        </button>
        <span className="ml-3 font-semibold text-gray-900 dark:text-gray-100">Hoca Paneli</span>
        <div className="ml-auto">
          <ThemeBtn />
        </div>
      </div>

      {/* ── Mobil drawer backdrop ─────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-700 z-50
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0`}
      >
        <Sidebar />
      </aside>

      {/* ── İçerik ───────────────────────────────────────────────── */}
      <main className="md:ml-64 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout;
