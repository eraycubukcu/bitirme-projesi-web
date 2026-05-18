import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../ThemeContext";

const menu = [
  { name: "Dashboard",         path: "/admin/dashboard" },
  { name: "Başvuru Listesi",   path: "/admin/students" },
  { name: "Danışman Ayarları", path: "/admin/teachers" },
  { name: "Form Ayarları",     path: "/admin/form" },
  { name: "Atama Sonuçları",   path: "/admin/assignedStudents" },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // mobil drawer
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("adminSidebarCollapsed") === "1";
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Scroll-to-top butonu: 400px aşağıdaysa görünür yap
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/admin/login", { replace: true });
  };

  const ThemeBtn = () => (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors
        bg-gray-900 text-white dark:bg-white dark:text-black flex-shrink-0"
      title={theme === "dark" ? "Aydınlık tema" : "Karanlık tema"}
    >
      ☾
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">

      {/* ── Mobil üst bar ────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-950 border-b dark:border-zinc-800
        flex items-center px-4 z-40">
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5
          rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
          aria-label="Menü"
        >
          <span className="w-5 h-0.5 bg-gray-700 dark:bg-white rounded" />
          <span className="w-5 h-0.5 bg-gray-700 dark:bg-white rounded" />
          <span className="w-5 h-0.5 bg-gray-700 dark:bg-white rounded" />
        </button>
        <Link to="/admin/dashboard"><img src="/kirmizi-logo-yatay.png" alt="Logo" className="ml-3 h-7 object-contain" /></Link>
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
        className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-zinc-950 border-r dark:border-zinc-800 z-50
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "md:-translate-x-full" : "md:translate-x-0"}`}
      >
        <div className="flex flex-col h-full p-5">
          <div className="flex items-start justify-between mb-6">
            <div>
              <Link to="/admin/dashboard"><img src="/kirmizi-logo-yatay.png" alt="Logo" className="h-10 object-contain mb-5" /></Link>
              <h1 className="text-lg font-semibold dark:text-white">Admin Panel</h1>
              <p className="text-xs text-gray-400">Danışman Sistemi</p>
            </div>
            <ThemeBtn />
          </div>
          <nav className="space-y-1 flex-1">
            {menu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm transition
                ${location.pathname === item.path
                  ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                  : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition text-left pt-4 border-t dark:border-zinc-800"
          >
            Çıkış Yap
          </button>
        </div>

        {/* Toggle butonu — sidebar'ın sağ kenarına entegre, onunla beraber slide eder */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex absolute top-6 -right-3 w-6 h-10 items-center justify-center
            rounded-r-lg bg-white dark:bg-zinc-950 border border-l-0 dark:border-zinc-800
            text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white
            hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors shadow-sm"
          title="Menüyü kapat"
          aria-label="Menüyü kapat"
        >
          <span className="text-xs leading-none">‹</span>
        </button>
      </aside>

      {/* ── Açma butonu — sidebar kapalıyken ekranın sol kenarında ──────── */}
      <button
        onClick={() => setCollapsed(false)}
        className={`hidden md:flex fixed top-6 left-0 w-6 h-10 items-center justify-center
          rounded-r-lg bg-white dark:bg-zinc-950 border border-l-0 dark:border-zinc-800
          text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white
          hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all duration-300 ease-in-out shadow-sm z-40
          ${collapsed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"}`}
        title="Menüyü aç"
        aria-label="Menüyü aç"
      >
        <span className="text-xs leading-none">›</span>
      </button>

      {/* ── İçerik ───────────────────────────────────────────────── */}
      <main
        className={`pt-14 md:pt-0 min-h-screen transition-[margin] duration-300 ease-in-out
          ${collapsed ? "md:ml-0" : "md:ml-64"}`}
      >
        <Outlet />
      </main>

      {/* ── Yukarı çık butonu (sağ alt köşe) ─────────────────────── */}
      <button
        onClick={scrollToTop}
        aria-label="Yukarı çık"
        title="Yukarı çık"
        className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full
          bg-white text-black border border-gray-200 dark:border-zinc-700
          shadow-lg hover:shadow-xl hover:scale-105
          flex items-center justify-center
          transition-all duration-200
          ${showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  );
};

export default AdminLayout;
