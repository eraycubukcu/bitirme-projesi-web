import { useEffect, useState } from "react";
import api from "../../services/api";

const TeachersPage = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [minQuota, setMinQuota] = useState(0);
  const [maxQuota, setMaxQuota] = useState(0);

  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/teachers");
      setTeachers(res.data);
    } catch {
      setFetchError("Danışmanlar yüklenemedi.");
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const openAddModal = () => {
    setEditTeacher(null);
    setName("");
    setUsername("");
    setPassword("");
    setMinQuota(0);
    setMaxQuota(0);
    setModalError("");
    setShowModal(true);
  };

  const openEditModal = (t: any) => {
    setEditTeacher(t);
    setName(t.name);
    setUsername(t.username);
    setPassword("");
    setMinQuota(t.minQuota);
    setMaxQuota(t.maxQuota);
    setModalError("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!name || !username || maxQuota <= 0) {
      setModalError("İsim, kullanıcı adı ve geçerli bir max kontenjan zorunludur.");
      return;
    }
    if (!editTeacher && !password) {
      setModalError("Yeni hoca için şifre zorunludur.");
      return;
    }
    if (minQuota > maxQuota) {
      setModalError("Min değer, max değerden büyük olamaz.");
      return;
    }

    setLoading(true);
    setModalError("");

    try {
      if (editTeacher) {
        const payload: any = { name, username, minQuota, maxQuota };
        if (password) payload.password = password;
        await api.put(`/teachers/${editTeacher._id}`, payload);
      } else {
        await api.post("/teachers", { name, username, password, minQuota, maxQuota });
      }
      await fetchTeachers();
      setShowModal(false);
    } catch (err: any) {
      setModalError(err.response?.data?.message || "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/teachers/${id}`);
      setConfirmDeleteId(null);
      await fetchTeachers();
    } catch (err: any) {
      setConfirmDeleteId(null);
      setFetchError(err.response?.data?.message || "Silinemedi.");
      setTimeout(() => setFetchError(""), 4000);
    }
  };

  if (fetchError && teachers.length === 0)
    return <div className="p-6 text-red-500">{fetchError}</div>;

  return (
    <div className="p-6 w-full max-w-2xl mx-auto">

      {/* ── Başlık ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Danışmanlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">{teachers.length} danışman</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-black transition"
        >
          + Danışman Ekle
        </button>
      </div>

      {/* Silme hatası */}
      {fetchError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          {fetchError}
        </div>
      )}

      {/* ── Liste ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {teachers.length === 0 && (
          <div className="text-center py-16 text-sm text-gray-300 border border-dashed rounded-xl">
            Henüz danışman eklenmedi.
          </div>
        )}

        {teachers.map((t) => (
          <div key={t._id} className="bg-white border rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.hasFinalized
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.hasFinalized ? "Onayladı" : "Bekliyor"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">@{t.username}</p>

                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-500">
                    {t.currentCount} / {t.maxQuota} öğrenci
                    <span className="text-gray-300 mx-1">·</span>
                    Min: {t.minQuota}
                  </p>
                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-gray-400 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${t.maxQuota > 0 ? Math.min((t.currentCount / t.maxQuota) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 ml-4 flex-shrink-0">
                <button
                  onClick={() => openEditModal(t)}
                  className="text-sm text-blue-500 hover:text-blue-700 transition"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => setConfirmDeleteId(t._id)}
                  className="text-sm text-red-400 hover:text-red-600 transition"
                >
                  Sil
                </button>
              </div>
            </div>

            {/* Silme onayı — inline */}
            {confirmDeleteId === t._id && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <p className="text-xs text-gray-500">Bu danışman silinecek. Emin misin?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg
                    hover:bg-red-600 transition"
                  >
                    Evet, Sil
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs px-3 py-1.5 border rounded-lg text-gray-600
                    hover:bg-gray-50 transition"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white p-6 rounded-xl shadow-lg w-80 space-y-4">
            <h2 className="font-semibold text-gray-800">
              {editTeacher ? "Danışman Güncelle" : "Danışman Ekle"}
            </h2>

            {/* İsim */}
            <div className="relative">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=" "
                className="peer w-full border rounded-lg px-3 pt-5 pb-2 text-sm
                focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <label className="absolute left-3 top-2 text-gray-400 text-xs bg-white px-1
                pointer-events-none transition-all
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs">
                İsim
              </label>
            </div>

            {/* Kullanıcı adı */}
            <div className="relative">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                className="peer w-full border rounded-lg px-3 pt-5 pb-2 text-sm
                focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <label className="absolute left-3 top-2 text-gray-400 text-xs bg-white px-1
                pointer-events-none transition-all
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs">
                Kullanıcı Adı
              </label>
            </div>

            {/* Şifre */}
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer w-full border rounded-lg px-3 pt-5 pb-2 text-sm
                focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <label className="absolute left-3 top-2 text-gray-400 text-xs bg-white px-1
                pointer-events-none transition-all
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs">
                {editTeacher ? "Şifre (değiştirmek için doldurun)" : "Şifre"}
              </label>
            </div>

            {/* Min/Max */}
            <div className="flex gap-2">
              <div className="relative w-1/2">
                <input
                  type="number"
                  min="0"
                  value={minQuota}
                  onChange={(e) => setMinQuota(Number(e.target.value))}
                  placeholder=" "
                  className="peer w-full border rounded-lg px-3 pt-5 pb-2 text-sm
                  focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
                <label className="absolute left-3 top-2 text-gray-400 text-xs bg-white px-1
                  pointer-events-none transition-all
                  peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                  peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                  peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs">
                  Min Öğrenci
                </label>
              </div>

              <div className="relative w-1/2">
                <input
                  type="number"
                  min="0"
                  value={maxQuota}
                  onChange={(e) => setMaxQuota(Number(e.target.value))}
                  placeholder=" "
                  className="peer w-full border rounded-lg px-3 pt-5 pb-2 text-sm
                  focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
                <label className="absolute left-3 top-2 text-gray-400 text-xs bg-white px-1
                  pointer-events-none transition-all
                  peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                  peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                  peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs">
                  Max Öğrenci
                </label>
              </div>
            </div>

            {/* Hata mesajı */}
            {modalError && (
              <p className="text-xs text-red-500">{modalError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm
              hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Kaydediliyor..." : editTeacher ? "Güncelle" : "Ekle"}
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full text-sm bg-gray-100 rounded-xl py-2 hover:bg-gray-200 transition"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;
