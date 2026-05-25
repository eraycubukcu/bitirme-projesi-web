import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../services/api";
import { SkeletonTeacherCard } from "../components/Skeleton";

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
  const [isFetching, setIsFetching] = useState(true);
  const [modalError, setModalError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/admin/teachers");
      setTeachers(res.data);
    } catch {
      setFetchError("Danışmanlar yüklenemedi.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => { document.title = "Danışmanlar"; }, []);
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
    if (minQuota < 0) {
      setModalError("Min değer 0 veya üstü olmalıdır.");
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
      toast.success(editTeacher ? "Danışman güncellendi." : "Danışman eklendi.");
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
      toast.success("Danışman silindi.");
    } catch (err: any) {
      setConfirmDeleteId(null);
      toast.error(err.response?.data?.message || "Silinemedi.");
    }
  };

  if (fetchError && teachers.length === 0)
    return <div className="p-6 text-red-500">{fetchError}</div>;

  const inputCls = "peer w-full border dark:border-zinc-700 rounded-lg px-3 pt-5 pb-2 text-sm " +
    "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white " +
    "focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white";

  const labelCls = "absolute left-3 top-2 text-gray-400 dark:text-gray-500 text-xs bg-white dark:bg-zinc-900 px-1 " +
    "pointer-events-none transition-all " +
    "peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm " +
    "peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900 dark:peer-focus:text-white " +
    "peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs";

  return (
    <div className="p-6 w-full max-w-2xl mx-auto">

      {/* ── Başlık ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Danışmanlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">{teachers.length} danışman</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-sm rounded-lg
          hover:bg-black dark:hover:bg-zinc-100 transition"
        >
          + Danışman Ekle
        </button>
      </div>

      {fetchError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          {fetchError}
        </div>
      )}

      {/* ── Liste ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {isFetching && Array.from({ length: 3 }).map((_, i) => <SkeletonTeacherCard key={i} />)}

        {!isFetching && teachers.length === 0 && (
          <div className="text-center py-16 text-sm text-gray-300 dark:text-zinc-700 border dark:border-zinc-800 border-dashed rounded-xl">
            Henüz danışman eklenmedi.
          </div>
        )}

        {teachers.map((t) => (
          <div key={t._id} className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.hasFinalized
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {t.hasFinalized ? "Onayladı" : "Bekliyor"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">@{t.username}</p>

                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.currentCount} / {t.maxQuota} öğrenci
                    <span className="text-gray-300 dark:text-zinc-700 mx-1">·</span>
                    Min: {t.minQuota}
                  </p>
                  <div className="w-20 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                    <div
                      className="bg-gray-400 dark:bg-zinc-500 h-1.5 rounded-full transition-all"
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

            {confirmDeleteId === t._id && (
              <div className="mt-3 pt-3 border-t dark:border-zinc-800 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">Bu danışman silinecek. Emin misin?</p>
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
                    className="text-xs px-3 py-1.5 border dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-300
                    hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-end sm:items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white dark:bg-zinc-950 p-5 sm:p-6 rounded-t-2xl sm:rounded-xl shadow-lg border dark:border-zinc-800 w-full sm:w-80 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-gray-800 dark:text-white">
              {editTeacher ? "Danışman Güncelle" : "Danışman Ekle"}
            </h2>

            <div className="relative">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder=" " className={inputCls} />
              <label className={labelCls}>İsim</label>
            </div>

            <div className="relative">
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder=" " className={inputCls} />
              <label className={labelCls}>Kullanıcı Adı</label>
            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className={inputCls}
              />
              <label className={labelCls}>
                {editTeacher ? "Şifre (değiştirmek için doldurun)" : "Şifre"}
              </label>
            </div>

            <div className="flex gap-2">
              <div className="relative w-1/2">
                <input
                  type="number"
                  min="0"
                  value={minQuota}
                  onChange={(e) => setMinQuota(Number(e.target.value))}
                  placeholder=" "
                  className={inputCls}
                />
                <label className={labelCls}>Min Öğrenci</label>
              </div>

              <div className="relative w-1/2">
                <input
                  type="number"
                  min="0"
                  value={maxQuota}
                  onChange={(e) => setMaxQuota(Number(e.target.value))}
                  placeholder=" "
                  className={inputCls}
                />
                <label className={labelCls}>Max Öğrenci</label>
              </div>
            </div>

            {modalError && (
              <p className="text-xs text-red-500">{modalError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-2.5 rounded-xl text-sm
              hover:bg-black dark:hover:bg-zinc-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Kaydediliyor..." : editTeacher ? "Güncelle" : "Ekle"}
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full text-sm bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-white rounded-xl py-2 hover:bg-gray-200 dark:hover:bg-zinc-800 transition"
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
