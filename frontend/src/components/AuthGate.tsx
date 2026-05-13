import { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  useAuth,
  useClerk,
  useSignIn,
} from "@clerk/clerk-react";
import { toast } from "sonner";
import api from "../services/api";

const ALLOWED_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || "okul.edu.tr";

interface AuthGateProps {
  children: React.ReactNode;
}

function SyncGuard({ children }: AuthGateProps) {
  const { isLoaded } = useAuth();
  const { signOut } = useClerk();
  const [status, setStatus] = useState<"loading" | "ok" | "rejected">("loading");

  useEffect(() => {
    if (!isLoaded) return;
    api
      .post("/auth/sync")
      .then(() => setStatus("ok"))
      .catch((err) => {
        const msg =
          err.response?.status === 403
            ? err.response.data?.message ||
              `Bu hesap kabul edilmiyor. Lütfen @${ALLOWED_DOMAIN} uzantılı okul hesabınızla giriş yapın.`
            : "Kimlik doğrulaması başarısız. Lütfen tekrar deneyin.";
        toast.error(msg, { duration: 6000 });
        setStatus("rejected");
        // Toast okunabilsin diye kısa bir gecikme sonra sign out
        setTimeout(() => signOut(), 1500);
      });
  }, [isLoaded, signOut]);

  if (status === "loading" || status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="w-8 h-8 border-2 border-gray-300 dark:border-zinc-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

function useGoogleSignIn() {
  const { signIn, isLoaded } = useSignIn();
  const [isStarting, setIsStarting] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn || isStarting) return;
    setIsStarting(true);
    try {
      // create() ile OAuth URL'i alıp prompt=select_account ekleriz.
      // authenticateWithRedirect + oidcPrompt yöntemi shared credentials
      // modunda Google'a iletilmediğinden bu yaklaşım daha güvenilir.
      const attempt = await signIn.create({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        actionCompleteRedirectUrl: window.location.origin,
        oidcPrompt: "select_account",
      });
      const oauthUrl = attempt.firstFactorVerification.externalVerificationRedirectURL;
      if (!oauthUrl) throw new Error("OAuth URL alınamadı");
      const url = new URL(oauthUrl.toString());
      url.searchParams.set("prompt", "select_account");
      window.location.href = url.toString();
    } catch {
      toast.error("Giriş başlatılamadı, tekrar deneyin.");
      setIsStarting(false);
    }
  };

  return { handleGoogleSignIn, isStarting };
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthGate({ children }: AuthGateProps) {
  const { handleGoogleSignIn, isStarting } = useGoogleSignIn();

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

            <button
              onClick={handleGoogleSignIn}
              disabled={isStarting}
              className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-black dark:hover:bg-zinc-100 transition flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              {isStarting ? "Yönlendiriliyor..." : "Google ile Giriş Yap"}
            </button>

            <p className="text-xs text-gray-400">
              Sadece{" "}
              <span className="font-medium">@{ALLOWED_DOMAIN}</span>{" "}
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
