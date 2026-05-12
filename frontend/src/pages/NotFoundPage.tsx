import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <button
        onClick={toggle}
        className="fixed top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm
          bg-gray-900 text-white dark:bg-white dark:text-black z-50 transition-colors"
        title={theme === "dark" ? "Aydınlık tema" : "Karanlık tema"}
      >
        ☾
      </button>

      <div className="w-full max-w-sm text-center space-y-6">
        <div className="space-y-2">
          <p className="text-7xl font-bold text-gray-200 dark:text-zinc-800 select-none">
            404
          </p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sayfa Bulunamadı
          </h1>
          <p className="text-sm text-gray-400 dark:text-zinc-500">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white
            text-white dark:text-black text-sm font-medium rounded-lg
            hover:bg-black dark:hover:bg-zinc-100 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}
