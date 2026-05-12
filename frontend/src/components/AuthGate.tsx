import { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useAuth,
} from "@clerk/clerk-react";
import { toast } from "sonner";
import api from "../services/api";

const ALLOWED_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || "okul.edu.tr";

interface AuthGateProps {
  children: React.ReactNode;
}

function SyncGuard({ children }: AuthGateProps) {
  const { isLoaded } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "forbidden">("loading");

  useEffect(() => {
    if (!isLoaded) return;
    api
      .post("/auth/sync")
      .then(() => setStatus("ok"))
      .catch((err) => {
        if (err.response?.status === 403) {
          toast.error(err.response.data?.message || "Bu hesap kabul edilmiyor.");
          setStatus("forbidden");
        } else {
          // Geçici hata — yeniden dene
          setStatus("forbidden");
        }
      });
  }, [isLoaded]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="w-8 h-8 border-2 border-gray-300 dark:border-zinc-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-xl border dark:border-zinc-800 shadow-sm p-8 text-center space-y-4">
          <img src="/kirmizi-logo.png" alt="Logo" className="h-14 object-contain mx-auto" />
          <p className="text-sm text-red-500">
            Bu hesap kabul edilmiyor. Sadece{" "}
            <span className="font-medium">@{ALLOWED_DOMAIN}</span> uzantılı
            hesaplar kabul edilmektedir.
          </p>
          <SignOutButton>
            <button className="text-sm text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-white transition">
              Farklı hesapla giriş yap
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AuthGate({ children }: AuthGateProps) {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-xl border dark:border-zinc-800 shadow-sm p-8 text-center space-y-6">
            <img src="/kirmizi-logo.png" alt="Logo" className="h-16 object-contain mx-auto" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Danışman Seçim Formu
              </h1>
              <p className="text-sm text-gray-400">
                Devam etmek için okul hesabınızla giriş yapın.
              </p>
            </div>
            <SignInButton mode="modal">
              <button className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-black dark:hover:bg-zinc-100 transition">
                Google ile Giriş Yap
              </button>
            </SignInButton>
            <p className="text-xs text-gray-400">
              Sadece <span className="font-medium">@{ALLOWED_DOMAIN}</span>{" "}
              uzantılı hesaplar kabul edilmektedir.
            </p>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <SyncGuard>{children}</SyncGuard>
      </SignedIn>
    </>
  );
}
