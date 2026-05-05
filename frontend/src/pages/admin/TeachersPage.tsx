import { useEffect, useState } from "react";
import api from "../../services/api";

const TeachersPage = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<any>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [minQuota, setMinQuota] = useState(0);
  const [maxQuota, setMaxQuota] = useState(0);

  const [loading, setLoading] = useState(false);

  const [fetchError, setFetchError] = useState("");

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/teachers");
      setTeachers(res.data);
    } catch {
      setFetchError("Danışmanlar yüklenemedi.");
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openAddModal = () => {
    setEditTeacher(null);
    setName("");
    setUsername("");
    setPassword("");
    setMinQuota(0);
    setMaxQuota(0);
    setShowModal(true);
  };

  const openEditModal = (t: any) => {
    setEditTeacher(t);
    setName(t.name);
    setUsername(t.username);
    setPassword("");
    setMinQuota(t.minQuota);
    setMaxQuota(t.maxQuota);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!name || !username || maxQuota <= 0) return;
    if (!editTeacher && !password) {
      alert("Yeni hoca için şifre zorunludur");
      return;
    }
    if (minQuota > maxQuota) {
      alert("Min, max'tan büyük olamaz");
      return;
    }

    setLoading(true);

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
      alert(err.response?.data?.message || "İşlem başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Silmek istediğine emin misin?");
    if (!ok) return;

    try {
      await api.delete(`/teachers/${id}`);
      await fetchTeachers();
    } catch {
      alert("Silinemedi");
    }
  };

  if (fetchError) return <div className="p-6 text-red-500">{fetchError}</div>;

  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-2">Danışman Bilgisi</h1>

      <button
        onClick={openAddModal}
        className="mb-6 px-4 py-2 bg-gray-900 text-white rounded-xl"
      >
        Danışman Ekle
      </button>

      <div className="space-y-3">
        {teachers.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400 border rounded-lg">
            Henüz danışman eklenmedi.
          </div>
        )}
        {teachers.map((t) => (
          <div
            key={t._id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-medium">{t.name}</p>
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
              <p className="text-xs text-gray-400">@{t.username}</p>
              <div className="flex items-center gap-3 mt-1.5">
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

            <div className="flex gap-4">
              <button
                onClick={() => openEditModal(t)}
                className="text-sm text-blue-500 hover:text-blue-700 transition"
              >
                Düzenle
              </button>
              <button
                onClick={() => handleDelete(t._id)}
                className="text-sm text-red-500 hover:text-red-700 transition"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-80 space-y-4">
            <h2 className="font-semibold">
              {editTeacher ? "Danışman Güncelle" : "Danışman Ekle"}
            </h2>

            {/* İsim */}
            <div className="relative">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=" "
                className="peer w-full border rounded px-3 pt-5 pb-2 text-sm
                focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <label className="absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
                transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs pointer-events-none">
                İsim
              </label>
            </div>

            {/* Kullanıcı adı */}
            <div className="relative">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                className="peer w-full border rounded px-3 pt-5 pb-2 text-sm
                focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <label className="absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
                transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs pointer-events-none">
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
                className="peer w-full border rounded px-3 pt-5 pb-2 text-sm
                focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <label className="absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
                transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs pointer-events-none">
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
                  className="peer w-full border rounded px-3 pt-5 pb-2 text-sm
                  focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
                <label className="absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
                  transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                  peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                  peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs pointer-events-none">
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
                  className="peer w-full border rounded px-3 pt-5 pb-2 text-sm
                  focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
                <label className="absolute left-3 top-2 text-gray-400 text-sm bg-white px-1
                  transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                  peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-900
                  peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs pointer-events-none">
                  Max Öğrenci
                </label>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 rounded-xl disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : editTeacher ? "Güncelle" : "Ekle"}
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full text-sm bg-gray-200 rounded-xl py-2"
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
