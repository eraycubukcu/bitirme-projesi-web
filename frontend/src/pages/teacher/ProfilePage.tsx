import { useEffect, useState } from "react";
import api from "../../services/api";

function ProfilePage() {
  const [bio, setBio] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/teachers/my-students");
        const teacherBio = res.data.teacher?.bio ?? "";
        setBio(teacherBio);
        setOriginalBio(teacherBio);
      } catch {
        setError("Profil bilgileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api.put("/teachers/profile", { bio });
      setOriginalBio(bio);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const changed = bio !== originalBio;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-gray-400 animate-pulse">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Profilim</h1>
      <p className="text-sm text-gray-400 mb-6">
        Aşağıdaki bilgiler öğrencilerin danışman seçim formunda adınızın altında görünecektir.
      </p>

      <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-5">
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
          Hakkımda / Çalışma Alanlarım
        </label>
        <textarea
          value={bio}
          onChange={(e) => { setBio(e.target.value); setError(""); setSuccess(false); }}
          maxLength={1000}
          rows={6}
          placeholder="Örn: Yapay zeka, makine öğrenmesi ve veri bilimi alanlarında çalışıyorum. Tez konusu olarak derin öğrenme uygulamaları üzerine çalışmak isteyen öğrencilerle ilgileniyorum."
          className="w-full border dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm resize-none
            bg-white dark:bg-zinc-900 text-gray-900 dark:text-white
            focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white
            placeholder:text-gray-300 dark:placeholder:text-zinc-600"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{bio.length}/1000</span>
          {success && (
            <span className="text-xs text-green-600 dark:text-green-400">✓ Kaydedildi</span>
          )}
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !changed}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg
              hover:bg-black dark:hover:bg-zinc-100 transition disabled:opacity-40"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {changed && (
            <button
              onClick={() => { setBio(originalBio); setError(""); }}
              className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition"
            >
              İptal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
